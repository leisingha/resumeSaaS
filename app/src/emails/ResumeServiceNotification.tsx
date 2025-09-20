import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components';

interface ResumeServiceNotificationProps {
  requestId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceType: 'review' | 'writing';
  resumeFocusAreas: string[];
  jobTitles: string[];
  experience?: string;
  additionalInfo?: string;
  resumeFileName?: string;
  resumeDownloadUrl?: string | null;
  resumeFileKey?: string;
  paymentStatus: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: Date;
  submittedAt: Date;
  isRegisteredUser: boolean;
}

const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';

export const ResumeServiceNotification = ({
  requestId,
  firstName,
  lastName,
  email,
  phone,
  serviceType,
  resumeFocusAreas,
  jobTitles,
  experience,
  additionalInfo,
  resumeFileName,
  resumeDownloadUrl,
  resumeFileKey,
  paymentStatus,
  stripeSessionId,
  stripePaymentIntentId,
  paidAt,
  submittedAt,
  isRegisteredUser,
}: ResumeServiceNotificationProps) => {
  const serviceTypeDisplay = serviceType === 'review' ? 'Resume Review' : 'Resume Writing Service';
  const priceDisplay = serviceType === 'review' ? '$50 CAD' : '$100 CAD';

  return (
    <Html>
      <Preview>New {serviceTypeDisplay} Request - {firstName} {lastName}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#fbca1f",
              },
            },
          },
        }}
      >
        <Head />
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-2xl">
            {/* Header */}
            <Section className="bg-white rounded-lg border border-gray-200">
              <div className="bg-yellow-400 px-6 py-4">
                <Heading className="text-2xl font-bold text-gray-900 m-0">
                  🎯 New {serviceTypeDisplay} Request
                </Heading>
                <Text className="text-gray-800 m-0 mt-1 text-sm font-medium">
                  Request ID: {requestId.substring(0, 8)}...
                </Text>
              </div>

              {/* Service Overview */}
              <Section className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <Row>
                  <Column className="w-1/2">
                    <Text className="text-sm font-semibold text-gray-700 m-0">Service Type</Text>
                    <Text className="text-lg font-bold text-gray-900 m-0">{serviceTypeDisplay}</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text className="text-sm font-semibold text-gray-700 m-0">Amount</Text>
                    <Text className="text-lg font-bold text-green-600 m-0">{priceDisplay}</Text>
                  </Column>
                </Row>
                <Row className="mt-3">
                  <Column className="w-1/2">
                    <Text className="text-sm font-semibold text-gray-700 m-0">Submitted</Text>
                    <Text className="text-sm text-gray-900 m-0">{submittedAt.toLocaleString()}</Text>
                  </Column>
                  <Column className="w-1/2 text-right">
                    <Text className="text-sm font-semibold text-gray-700 m-0">Payment Status</Text>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      paymentStatus === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {paymentStatus.toUpperCase()}
                    </span>
                  </Column>
                </Row>
              </Section>

              {/* Client Information */}
              <Section className="px-6 py-4">
                <Heading className="text-lg font-bold text-gray-900 mb-3 mt-0">
                  👤 Client Information
                </Heading>
                <div>
                  <Row className="mb-2">
                    <Column className="w-1/3">
                      <Text className="text-sm font-semibold text-gray-600 m-0">Name:</Text>
                    </Column>
                    <Column className="w-2/3">
                      <Text className="text-sm text-gray-900 m-0">{firstName} {lastName}</Text>
                    </Column>
                  </Row>
                  <Row className="mb-2">
                    <Column className="w-1/3">
                      <Text className="text-sm font-semibold text-gray-600 m-0">Email:</Text>
                    </Column>
                    <Column className="w-2/3">
                      <Text className="text-sm text-blue-600 m-0">{email}</Text>
                    </Column>
                  </Row>
                  {phone && (
                    <Row className="mb-2">
                      <Column className="w-1/3">
                        <Text className="text-sm font-semibold text-gray-600 m-0">Phone:</Text>
                      </Column>
                      <Column className="w-2/3">
                        <Text className="text-sm text-gray-900 m-0">{phone}</Text>
                      </Column>
                    </Row>
                  )}
                  <Row>
                    <Column className="w-1/3">
                      <Text className="text-sm font-semibold text-gray-600 m-0">Account:</Text>
                    </Column>
                    <Column className="w-2/3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        isRegisteredUser
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isRegisteredUser ? 'Registered User' : 'Guest User'}
                      </span>
                    </Column>
                  </Row>
                </div>
              </Section>

              <Hr className="mx-6 my-0 border-gray-200" />

              {/* Service Requirements */}
              <Section className="px-6 py-4">
                <Heading className="text-lg font-bold text-gray-900 mb-3 mt-0">
                  📋 Service Requirements
                </Heading>

                <div className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-1 mt-0">Focus Areas:</Text>
                  <div>
                    {resumeFocusAreas.map((area, index) => (
                      <span key={index} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium mr-1 mb-1">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-1 mt-0">Target Job Titles:</Text>
                  <div>
                    {jobTitles.map((title, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-1 mb-1">
                        {title}
                      </span>
                    ))}
                  </div>
                </div>

                {experience && (
                  <div className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-1 mt-0">Experience Level:</Text>
                    <Text className="text-sm text-gray-900 m-0">{experience}</Text>
                  </div>
                )}
              </Section>

              {/* Resume File */}
              {resumeFileName ? (
                <Section className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                  <Heading className="text-lg font-bold text-gray-900 mb-3 mt-0">
                    📄 Resume File
                  </Heading>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <Text className="text-sm font-semibold text-gray-700 m-0 mb-2">Filename:</Text>
                    <Text className="text-sm text-gray-900 m-0 mb-3">{resumeFileName}</Text>

                    {resumeDownloadUrl ? (
                      <Button
                        href={resumeDownloadUrl}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                      >
                        📥 Download Resume
                      </Button>
                    ) : (
                      <div>
                        <Text className="text-xs text-gray-600 m-0">S3 Key:</Text>
                        <Text className="text-xs text-gray-800 font-mono bg-gray-100 p-1 rounded m-0">
                          {resumeFileKey}
                        </Text>
                      </div>
                    )}
                  </div>
                </Section>
              ) : (
                <Section className="px-6 py-4 bg-orange-50 border-t border-orange-200">
                  <div className="flex items-center">
                    <Text className="text-orange-800 font-semibold m-0">
                      ⚠️ No resume file uploaded
                    </Text>
                  </div>
                </Section>
              )}

              {/* Additional Information */}
              {additionalInfo && (
                <Section className="px-6 py-4 border-t border-gray-200">
                  <Heading className="text-lg font-bold text-gray-900 mb-3 mt-0">
                    💬 Additional Information
                  </Heading>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Text className="text-sm text-gray-800 m-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {additionalInfo}
                    </Text>
                  </div>
                </Section>
              )}

              {/* Payment Information */}
              <Section className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Heading className="text-lg font-bold text-gray-900 mb-3 mt-0">
                  💳 Payment Information
                </Heading>
                <div>
                  {stripeSessionId && (
                    <Row className="mb-2">
                      <Column className="w-1/3">
                        <Text className="text-sm font-semibold text-gray-600 m-0">Session ID:</Text>
                      </Column>
                      <Column className="w-2/3">
                        <Text className="text-xs font-mono bg-gray-100 p-1 rounded text-gray-800 m-0">
                          {stripeSessionId}
                        </Text>
                      </Column>
                    </Row>
                  )}
                  {stripePaymentIntentId && (
                    <Row className="mb-2">
                      <Column className="w-1/3">
                        <Text className="text-sm font-semibold text-gray-600 m-0">Payment Intent:</Text>
                      </Column>
                      <Column className="w-2/3">
                        <Text className="text-xs font-mono bg-gray-100 p-1 rounded text-gray-800 m-0">
                          {stripePaymentIntentId}
                        </Text>
                      </Column>
                    </Row>
                  )}
                  {paidAt && (
                    <Row>
                      <Column className="w-1/3">
                        <Text className="text-sm font-semibold text-gray-600 m-0">Paid At:</Text>
                      </Column>
                      <Column className="w-2/3">
                        <Text className="text-sm text-gray-900 m-0">{paidAt.toLocaleString()}</Text>
                      </Column>
                    </Row>
                  )}
                </div>
              </Section>

              {/* Footer */}
              <Section className="px-6 py-4 bg-gray-100 text-center">
                <Text className="text-xs text-gray-600 m-0">
                  Request submitted through Applify Resume Service
                </Text>
                <Text className="text-xs text-gray-500 m-0 mt-1">
                  {new Date().toLocaleString()}
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ResumeServiceNotification;