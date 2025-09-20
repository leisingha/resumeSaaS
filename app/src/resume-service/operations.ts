import * as z from "zod";
import { HttpError } from "wasp/server";
import { emailSender } from "wasp/server/email";
import { type ResumeServiceRequest } from "wasp/entities";
import { paymentProcessor } from "../payment/paymentProcessor";
import { PaymentPlanId, paymentPlans } from "../payment/plans";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { validateFile } from "../file-upload/fileUploading";
import {
  getUploadFileSignedURLFromS3,
  getDownloadFileSignedURLFromS3,
} from "../file-upload/s3Utils";
import { ALLOWED_FILE_TYPES } from "../file-upload/validation";

// Zod schemas for validation
const resumeServiceFormSchema = z.object({
  serviceType: z.enum(["review", "writing"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  resumeFocusAreas: z
    .array(z.string())
    .min(1, "At least one focus area is required")
    .max(3, "Maximum 3 focus areas allowed"),
  jobTitles: z
    .array(z.string())
    .min(1, "At least one job title is required")
    .max(3, "Maximum 3 job titles allowed"),
  experience: z.string().optional(),
  additionalInfo: z.string().optional(),
  resumeFileKey: z.string().optional(), // S3 key of uploaded file
  resumeFileName: z.string().optional(), // Original filename
});

type ResumeServiceFormInput = z.infer<typeof resumeServiceFormSchema>;

export type SubmitResumeServiceResponse = {
  requestId: string;
  checkoutUrl: string | null;
};

// Action to submit resume service request
export const submitResumeService = async (
  rawFormData: ResumeServiceFormInput,
  context: any
): Promise<SubmitResumeServiceResponse> => {
  console.log("[submitResumeService] Starting submission process");

  const formData = ensureArgsSchemaOrThrowHttpError(
    resumeServiceFormSchema,
    rawFormData
  );

  // Validate service type for file requirement
  if (formData.serviceType === "review" && !formData.resumeFileKey) {
    throw new HttpError(400, "Resume file is required for review service");
  }

  try {
    // Create initial resume service request
    const resumeServiceRequest =
      await context.entities.ResumeServiceRequest.create({
        data: {
          serviceType: formData.serviceType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          resumeFocusAreas: formData.resumeFocusAreas,
          jobTitles: formData.jobTitles,
          experience: formData.experience,
          additionalInfo: formData.additionalInfo,
          resumeFileKey: formData.resumeFileKey,
          resumeFileName: formData.resumeFileName,
          paymentStatus: "pending",
          requestStatus: "submitted",
          user: context.user ? { connect: { id: context.user.id } } : undefined,
        },
      });

    console.log(
      "[submitResumeService] Resume service request created:",
      resumeServiceRequest.id
    );

    // Determine payment plan based on service type
    const paymentPlanId =
      formData.serviceType === "review"
        ? PaymentPlanId.ResumeReview
        : PaymentPlanId.ResumeWriting;

    const paymentPlan = paymentPlans[paymentPlanId];

    // Create Stripe checkout session
    const { session } = await paymentProcessor.createCheckoutSession({
      userId: context.user?.id || resumeServiceRequest.id, // Use request ID for guest users
      userEmail: formData.email,
      paymentPlan,
      prismaUserDelegate: context.entities.User,
      metadata: {
        resumeServiceRequestId: resumeServiceRequest.id,
        serviceType: formData.serviceType,
      },
      successUrl: `${
        process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000"
      }/resume-service?success=true`,
      cancelUrl: `${
        process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000"
      }/resume-service?canceled=true`,
    });

    // Update the request with the Stripe session ID
    await context.entities.ResumeServiceRequest.update({
      where: { id: resumeServiceRequest.id },
      data: { stripeSessionId: session.id },
    });

    console.log(
      "[submitResumeService] Stripe checkout session created:",
      session.id
    );

    return {
      requestId: resumeServiceRequest.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    console.error(
      "[submitResumeService] Error creating resume service request:",
      error
    );
    throw new HttpError(500, "Failed to create resume service request");
  }
};

// Helper function to send notification email
export const sendResumeServiceNotification = async (
  requestId: string,
  context: any
): Promise<void> => {
  try {
    const request = await context.entities.ResumeServiceRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error(`Resume service request not found: ${requestId}`);
    }

    // Create email content
    const serviceTypeDisplay =
      request.serviceType === "review"
        ? "Resume Review"
        : "Resume Writing Service";
    const priceDisplay =
      request.serviceType === "review" ? "$50 CAD" : "$100 CAD";

    const focusAreas = Array.isArray(request.resumeFocusAreas)
      ? request.resumeFocusAreas.join(", ")
      : JSON.stringify(request.resumeFocusAreas);

    const jobTitles = Array.isArray(request.jobTitles)
      ? request.jobTitles.join(", ")
      : JSON.stringify(request.jobTitles);

    // Generate download link for resume file if it exists
    let resumeDownloadUrl: string | null = null;
    if (request.resumeFileKey) {
      try {
        resumeDownloadUrl = await getDownloadFileSignedURLFromS3({
          key: request.resumeFileKey,
        });
      } catch (error) {
        console.error("Error generating download URL:", error);
      }
    }

    const emailSubject = `New ${serviceTypeDisplay} Request - ${request.firstName} ${request.lastName}`;

    const emailContent = `
New resume service request received:

Service Details:
- Service Type: ${serviceTypeDisplay} (${priceDisplay})
- Request ID: ${request.id}
- Submitted: ${request.createdAt.toLocaleString()}
- Payment Status: ${request.paymentStatus}

Client Information:
- Name: ${request.firstName} ${request.lastName}
- Email: ${request.email}
- Phone: ${request.phone || "Not provided"}
- User Account: ${request.user ? "Registered User" : "Guest User"}

Service Requirements:
- Focus Areas: ${focusAreas}
- Target Job Titles: ${jobTitles}
- Experience Level: ${request.experience || "Not specified"}

${
  request.resumeFileName
    ? `Resume File: ${request.resumeFileName}${
        resumeDownloadUrl
          ? `\nDownload Link: ${resumeDownloadUrl}`
          : `\nS3 Key: ${request.resumeFileKey}`
      }`
    : "No resume file uploaded"
}

Additional Information:
${request.additionalInfo || "None provided"}

Payment Information:
- Stripe Session ID: ${request.stripeSessionId}
- Payment Intent ID: ${request.stripePaymentIntentId || "Pending"}
- Paid At: ${request.paidAt ? request.paidAt.toLocaleString() : "Pending"}

---
Request submitted through Applify Resume Service
    `.trim();

    // Send email notification
    await emailSender.send({
      to: "lsingha@torontomu.ca",
      subject: emailSubject,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #fbca1f; padding-bottom: 10px;">
            New ${serviceTypeDisplay} Request
          </h2>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Service Details</h3>
            <p><strong>Service Type:</strong> ${serviceTypeDisplay} (${priceDisplay})</p>
            <p><strong>Request ID:</strong> ${request.id}</p>
            <p><strong>Submitted:</strong> ${request.createdAt.toLocaleString()}</p>
            <p><strong>Payment Status:</strong> <span style="color: ${
              request.paymentStatus === "completed" ? "green" : "orange"
            };">${request.paymentStatus}</span></p>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Client Information</h3>
            <p><strong>Name:</strong> ${request.firstName} ${
              request.lastName
            }</p>
            <p><strong>Email:</strong> <a href="mailto:${request.email}">${
              request.email
            }</a></p>
            <p><strong>Phone:</strong> ${request.phone || "Not provided"}</p>
            <p><strong>Account Type:</strong> ${
              request.user ? "Registered User" : "Guest User"
            }</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Service Requirements</h3>
            <p><strong>Focus Areas:</strong></p>
            <ul>
              ${
                Array.isArray(request.resumeFocusAreas)
                  ? request.resumeFocusAreas
                      .map((area) => `<li>${area}</li>`)
                      .join("")
                  : `<li>${request.resumeFocusAreas}</li>`
              }
            </ul>
            <p><strong>Target Job Titles:</strong></p>
            <ul>
              ${
                Array.isArray(request.jobTitles)
                  ? request.jobTitles
                      .map((title) => `<li>${title}</li>`)
                      .join("")
                  : `<li>${request.jobTitles}</li>`
              }
            </ul>
            <p><strong>Experience Level:</strong> ${
              request.experience || "Not specified"
            }</p>
          </div>

          ${
            request.resumeFileName
              ? `
          <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">📄 Resume File</h3>
            <p><strong>Filename:</strong> ${request.resumeFileName}</p>
            ${
              resumeDownloadUrl
                ? `
            <p><strong>Download Link:</strong> <a href="${resumeDownloadUrl}" style="color: #007bff; text-decoration: none;">Click here to download</a></p>
            `
                : `
            <p><strong>S3 Key:</strong> <code style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">${request.resumeFileKey}</code></p>
            `
            }
          </div>
          `
              : `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>⚠️ No resume file uploaded</strong></p>
          </div>
          `
          }

          ${
            request.additionalInfo
              ? `
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Additional Information</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${request.additionalInfo}</p>
          </div>
          `
              : ""
          }

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Payment Information</h3>
            <p><strong>Stripe Session ID:</strong> <code style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">${
              request.stripeSessionId
            }</code></p>
            <p><strong>Payment Intent ID:</strong> <code style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">${
              request.stripePaymentIntentId || "Pending"
            }</code></p>
            <p><strong>Paid At:</strong> ${
              request.paidAt ? request.paidAt.toLocaleString() : "Pending"
            }</p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Request submitted through Applify Resume Service at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log(
      "[sendResumeServiceNotification] Email sent successfully for request:",
      requestId
    );
  } catch (error) {
    console.error(
      "[sendResumeServiceNotification] Error sending email:",
      error
    );
    throw error;
  }
};

// Schema for resume file upload
const createResumeFileUploadSchema = z.object({
  fileType: z.enum(ALLOWED_FILE_TYPES),
  fileName: z.string().min(1),
});

type CreateResumeFileUploadInput = z.infer<typeof createResumeFileUploadSchema>;

// Action to create file upload URL for resume service (works for both authenticated and guest users)
export const createResumeFileUpload = async (
  rawArgs: CreateResumeFileUploadInput,
  context: any
): Promise<{
  s3UploadUrl: string;
  s3UploadFields: Record<string, string>;
  key: string;
}> => {
  console.log("[createResumeFileUpload] Starting file upload creation");

  const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(
    createResumeFileUploadSchema,
    rawArgs
  );

  try {
    // Use context.user.id if user is authenticated, otherwise generate a temp ID for guest uploads
    const userId =
      context.user?.id ||
      `guest-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const { s3UploadUrl, s3UploadFields, key } =
      await getUploadFileSignedURLFromS3({
        fileType,
        fileName,
        userId,
      });

    console.log("[createResumeFileUpload] Upload URL created:", key);

    return {
      s3UploadUrl,
      s3UploadFields,
      key,
    };
  } catch (error) {
    console.error("[createResumeFileUpload] Error creating upload URL:", error);
    throw new HttpError(500, "Failed to create file upload URL");
  }
};

// Helper function to send customer receipt email
export const sendCustomerReceipt = async (
  requestId: string,
  context: any
): Promise<void> => {
  try {
    const request = await context.entities.ResumeServiceRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new Error(`Resume service request not found: ${requestId}`);
    }

    // Create email content for customer receipt
    const serviceTypeDisplay =
      request.serviceType === "review"
        ? "Resume Review"
        : "Resume Writing Service";
    const priceDisplay =
      request.serviceType === "review" ? "$50 CAD" : "$100 CAD";

    const emailSubject = `Receipt for ${serviceTypeDisplay} - Order #${request.id.substring(
      0,
      8
    )}`;

    const emailContent = `
Thank you for your purchase!

Order Details:
- Service: ${serviceTypeDisplay}
- Price: ${priceDisplay}
- Order ID: ${request.id}
- Date: ${request.createdAt.toLocaleString()}
- Payment Status: ${request.paymentStatus}

Service Details:
- Customer: ${request.firstName} ${request.lastName}
- Email: ${request.email}
${request.phone ? `- Phone: ${request.phone}` : ""}

What's Next:
Our resume expert will review your request and begin working on your ${
      request.serviceType === "review"
        ? "resume review"
        : "resume writing project"
    }. You can expect to hear from us within 2-3 business days.

If you have any questions, please don't hesitate to contact us.

Thank you for choosing Applify Resume Services!

---
This is an automated receipt. Please keep it for your records.
    `.trim();

    // Send customer receipt email
    await emailSender.send({
      to: request.email,
      subject: emailSubject,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">Thank you for your purchase!</h1>
            <p style="color: #666; font-size: 16px;">Receipt for ${serviceTypeDisplay}</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Service:</td>
                <td style="padding: 8px 0;">${serviceTypeDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Price:</td>
                <td style="padding: 8px 0; font-size: 18px; color: #28a745; font-weight: bold;">${priceDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Order ID:</td>
                <td style="padding: 8px 0;"><code style="background: #f1f1f1; padding: 2px 4px; border-radius: 3px;">${
                  request.id
                }</code></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0;">${request.createdAt.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Payment Status:</td>
                <td style="padding: 8px 0;"><span style="color: ${
                  request.paymentStatus === "completed" ? "#28a745" : "#ffc107"
                }; font-weight: bold;">${request.paymentStatus.toUpperCase()}</span></td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">Service Details</h2>
            <p><strong>Customer:</strong> ${request.firstName} ${
              request.lastName
            }</p>
            <p><strong>Email:</strong> ${request.email}</p>
            ${
              request.phone
                ? `<p><strong>Phone:</strong> ${request.phone}</p>`
                : ""
            }
          </div>

          <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">What's Next?</h2>
            <p style="margin-bottom: 10px;">Our resume expert will review your request and begin working on your ${
              request.serviceType === "review"
                ? "resume review"
                : "resume writing project"
            }.</p>
            <p style="margin-bottom: 10px;"><strong>Expected timeline:</strong> You can expect to hear from us within 2-3 business days.</p>
            <p style="margin: 0;">If you have any questions, please don't hesitate to contact us.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 16px; margin-bottom: 10px;">Thank you for choosing Applify Resume Services!</p>
            <p style="color: #999; font-size: 12px;">This is an automated receipt. Please keep it for your records.</p>
          </div>
        </div>
      `,
    });

    console.log(
      "[sendCustomerReceipt] Customer receipt sent successfully for request:",
      requestId
    );
  } catch (error) {
    console.error(
      "[sendCustomerReceipt] Error sending customer receipt:",
      error
    );
    throw error;
  }
};
