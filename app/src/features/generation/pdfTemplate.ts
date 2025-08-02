// PDF Template for Resume Generation
// This template matches the exact styling used in the browser display

export const createPdfTemplate = (htmlContent: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume PDF</title>
      <style>
        @page {
          size: A4;
          margin: 0;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: serif;
          background: white;
          color: #333;
          font-size: 10pt;
          line-height: 1.4;
        }
        
        .resume-container {
          width: 8.27in;
          height: 11.69in;
          padding: 30px 40px 40px 40px;
          box-sizing: border-box;
          background: white;
          position: relative;
          overflow: hidden;
        }
        
        .content {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        /* Match exact resume styles from the generator */
        h1 {
          font-size: 24pt !important;
          font-weight: bold !important;
          margin: 0 !important;
          text-align: center;
        }
        
        h2 {
          font-size: 12pt !important;
          font-weight: bold !important;
          border-bottom: 1px solid #333 !important;
          padding-bottom: 2px !important;
          margin: 15px 0 10px !important;
        }
        
        h3 {
          font-size: 11pt !important;
          font-weight: bold !important;
          margin: 0 !important;
        }
        
        p {
          font-size: 10pt !important;
          line-height: 1.4 !important;
          margin: 2px 0 !important;
        }
        
        ul {
          list-style-type: disc !important;
          margin-left: 1.25rem !important;
          padding-left: 0 !important;
          margin-top: 5px !important;
          line-height: 1.4 !important;
        }
        
        li {
          margin-bottom: 0.25rem !important;
          font-size: 10pt !important;
          line-height: 1.4 !important;
        }
        
        /* Header styling - matches the generated resume structure */
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .contact-info {
          font-size: 10pt !important;
          margin: 5px 0 !important;
        }
        
        /* Section styling */
        .section {
          margin-bottom: 15px;
        }
        
        .experience-item, .education-item {
          margin-bottom: 15px;
        }
        
        /* Layout helpers for flex content */
        div[style*="display: flex"] {
          display: flex !important;
        }
        
        div[style*="justify-content: space-between"] {
          justify-content: space-between !important;
        }
        
        div[style*="text-align: right"] {
          text-align: right !important;
        }
        
        div[style*="text-align: center"] {
          text-align: center !important;
        }
        
        /* Ensure all inline styles are preserved and prioritized */
        [style] {
          /* Inline styles will override these base styles */
        }
        
        /* Handle content wrapper - matches the generation output exactly */
        .content > div {
          background-color: white !important;
          padding: 0 !important;
          font-family: serif !important;
          font-size: 10pt !important;
          color: #333 !important;
        }
        
        /* Additional spacing controls */
        div[style*="margin-bottom: 20px"] {
          margin-bottom: 20px !important;
        }
        
        div[style*="margin-bottom: 15px"] {
          margin-bottom: 15px !important;
        }
        
        div[style*="margin-bottom: 10px"] {
          margin-bottom: 10px !important;
        }
        
        div[style*="margin-bottom: 5px"] {
          margin-bottom: 5px !important;
        }
        
        /* Font size overrides to match generation exactly */
        [style*="font-size: 24pt"] {
          font-size: 24pt !important;
        }
        
        [style*="font-size: 12pt"] {
          font-size: 12pt !important;
        }
        
        [style*="font-size: 11pt"] {
          font-size: 11pt !important;
        }
        
        [style*="font-size: 10pt"] {
          font-size: 10pt !important;
        }
        
        /* Border styles */
        [style*="border-bottom: 1px solid #333"] {
          border-bottom: 1px solid #333 !important;
        }
        
        /* Text alignment */
        [style*="text-align: center"] {
          text-align: center !important;
        }
        
        [style*="text-align: right"] {
          text-align: right !important;
        }
        
        /* Line height consistency */
        [style*="line-height: 1.4"] {
          line-height: 1.4 !important;
        }
        
        /* Performance optimization - remove heavy selectors for PDF generation */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      </style>
    </head>
    <body>
      <div class="resume-container">
        <div class="content">
          ${htmlContent}
        </div>
      </div>
    </body>
    </html>
  `;
};