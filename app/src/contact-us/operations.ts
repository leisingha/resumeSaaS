import { emailSender } from "wasp/server/email";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

type ContactMessageAction = (
  contactData: ContactFormData,
  context: any
) => Promise<void>;

export const sendContactMessage: ContactMessageAction = async (
  contactData,
  context
) => {
  try {
    const { firstName, lastName, email, subject, message } = contactData;

    // Create email content
    const emailSubject = `Contact Form: ${subject}`;
    const emailContent = `
      New contact form submission from Applify:
      
      Name: ${firstName} ${lastName}
      Email: ${email}
      Subject: ${subject}
      
      Message:
      ${message}
      
      ---
      This message was sent from the Applify contact form.
    `;

    // Send email to your personal address
    await emailSender.send({
      to: "lsingha@torontomu.ca",
      subject: emailSubject,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This message was sent from the Applify contact form at ${new Date().toLocaleString()}.
          </p>
        </div>
      `,
    });

    console.log("Contact form email sent successfully");
  } catch (error) {
    console.error("Error sending contact form email:", error);
    throw new Error("Failed to send contact message. Please try again later.");
  }
};
