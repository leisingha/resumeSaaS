import { HttpError } from 'wasp/server';
import { chromium } from 'playwright';
import type { GenerateResumePdf } from 'wasp/server/operations';
import { createPdfTemplate } from './pdfTemplate';

// Type definition for the PDF generation input
type GeneratePdfPayload = {
  htmlContent: string;
  filename?: string;
};

// Type definition for the PDF generation output
type PdfResult = {
  pdfBase64: string;
  filename: string;
  size: number;
};

// Basic PDF generation function using Puppeteer
export const generateResumePdf: GenerateResumePdf<GeneratePdfPayload, PdfResult> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const { htmlContent, filename = 'resume.pdf' } = args;

  // Input validation
  if (!htmlContent || htmlContent.trim().length === 0) {
    throw new HttpError(400, 'HTML content is required for PDF generation');
  }

  if (htmlContent.length > 50000) { // 50KB limit for optimal performance
    console.warn(`[generateResumePdf] Large content detected for user ${context.user.id}: ${htmlContent.length} chars`);
    if (htmlContent.length > 100000) { // Hard limit
      throw new HttpError(400, 'HTML content is too large for PDF generation');
    }
  }

  console.log(`[generateResumePdf] User ${context.user.id} requested PDF generation for content length: ${htmlContent.length} chars`);

  let browser;
  try {
    // Launch Playwright browser with optimized settings for PDF generation
    browser = await chromium.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser', // Use system chromium
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--font-render-hinting=none',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--memory-pressure-off',
        '--max_old_space_size=1024'
      ]
    });

    const page = await browser.newPage();

    // Set viewport to A4 dimensions (794x1123px at 96 DPI)
    await page.setViewportSize({
      width: 794,
      height: 1123
    });

    // Disable JavaScript to improve performance and avoid layout shifts
    await page.addInitScript(() => {
      // Disable JavaScript execution
      Object.defineProperty(window, 'eval', { value: () => { throw new Error('JavaScript disabled'); } });
    });

    // Generate the PDF-optimized HTML using the template
    const htmlTemplate = createPdfTemplate(htmlContent);

    // Set the HTML content with optimized loading strategy
    await page.setContent(htmlTemplate, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Minimal wait for layout calculations (optimized for performance)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Generate PDF with optimized settings for resume output
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px', 
        bottom: '0px',
        left: '0px'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1
    });

    // Validate PDF generation
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation resulted in empty buffer');
    }

    console.log(`[generateResumePdf] PDF generated successfully for user ${context.user.id}, size: ${pdfBuffer.length} bytes`);

    // Ensure pdfBuffer is actually a Buffer and convert to base64 properly
    let pdfBase64: string;
    try {
      if (Buffer.isBuffer(pdfBuffer)) {
        pdfBase64 = pdfBuffer.toString('base64');
      } else {
        // If it's not a Buffer, create one and then convert
        const buffer = Buffer.from(pdfBuffer);
        pdfBase64 = buffer.toString('base64');
      }
      
      console.log(`[generateResumePdf] Base64 conversion successful - length: ${pdfBase64.length}, sample: ${pdfBase64.substring(0, 50)}...`);
    } catch (conversionError) {
      console.error(`[generateResumePdf] Base64 conversion failed for user ${context.user.id}:`, conversionError);
      throw new Error('Failed to convert PDF to base64');
    }

    // Validate base64 conversion
    if (!pdfBase64 || pdfBase64.length === 0) {
      throw new Error('Failed to convert PDF to base64');
    }

    // Verify it's actually base64 by checking first few characters
    if (!/^[A-Za-z0-9+/]/.test(pdfBase64)) {
      console.error(`[generateResumePdf] Invalid base64 start for user ${context.user.id}: ${pdfBase64.substring(0, 20)}`);
      throw new Error('Generated base64 string does not start with valid base64 characters');
    }

    const result = {
      pdfBase64,
      filename,
      size: pdfBuffer.length
    };

    console.log(`[generateResumePdf] PDF conversion successful - base64 length: ${pdfBase64.length} chars`);

    return result;

  } catch (error: any) {
    console.error(`[generateResumePdf] Error generating PDF for user ${context.user.id}:`, error);
    
    // Provide more specific error messages based on error type
    if (error.message?.includes('timeout')) {
      throw new HttpError(408, 'PDF generation timed out. Please try again with shorter content.');
    } else if (error.message?.includes('Navigation failed')) {
      throw new HttpError(500, 'Failed to load content for PDF generation. Please check your content format.');
    } else if (error.message?.includes('Protocol error')) {
      throw new HttpError(500, 'Browser communication error during PDF generation. Please try again.');
    } else if (error instanceof HttpError) {
      // Re-throw HttpErrors (like validation errors) as-is
      throw error;
    } else {
      throw new HttpError(500, `Failed to generate PDF: ${error.message || 'Unknown error'}`);
    }
  } finally {
    if (browser) {
      try {
        // Close browser for better memory management
        await browser.close();
        console.log(`[generateResumePdf] Browser closed for user ${context.user.id}`);
      } catch (closeError) {
        console.warn(`[generateResumePdf] Error closing browser for user ${context.user.id}:`, closeError);
        // Force kill the browser process if normal close fails
        try {
          await browser.close();
        } catch (forceCloseError) {
          console.error(`[generateResumePdf] Failed to force close browser for user ${context.user.id}:`, forceCloseError);
        }
      }
    }
  }
};