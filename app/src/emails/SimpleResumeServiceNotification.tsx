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

export const SimpleResumeServiceNotification = ({
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
      <Head />
      <Preview>New {serviceTypeDisplay} Request - {firstName} {lastName}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '32px 16px', maxWidth: '672px' }}>
          {/* Main Email Container */}
          <Section style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>

            {/* Header */}
            <div style={{ backgroundColor: '#fbca1f', padding: '24px' }}>
              <Heading style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0'
              }}>
                🎯 New {serviceTypeDisplay} Request
              </Heading>
              <Text style={{
                color: '#374151',
                margin: '4px 0 0 0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Request ID: {requestId.substring(0, 8)}...
              </Text>
            </div>

            {/* Service Overview */}
            <Section style={{
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <table style={{ width: '100%' }}>
                <tr>
                  <td style={{ width: '50%' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0' }}>
                      Service Type
                    </Text>
                    <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>
                      {serviceTypeDisplay}
                    </Text>
                  </td>
                  <td style={{ width: '50%', textAlign: 'right' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0' }}>
                      Amount
                    </Text>
                    <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669', margin: '0' }}>
                      {priceDisplay}
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingTop: '12px' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0' }}>
                      Submitted
                    </Text>
                    <Text style={{ fontSize: '14px', color: '#1f2937', margin: '0' }}>
                      {submittedAt.toLocaleString()}
                    </Text>
                  </td>
                  <td style={{ paddingTop: '12px', textAlign: 'right' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0' }}>
                      Payment Status
                    </Text>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: paymentStatus === 'completed' ? '#dcfce7' : '#fed7aa',
                      color: paymentStatus === 'completed' ? '#166534' : '#9a3412'
                    }}>
                      {paymentStatus.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Client Information */}
            <Section style={{ padding: '16px 24px' }}>
              <Heading style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 12px 0'
              }}>
                👤 Client Information
              </Heading>

              <table style={{ width: '100%', marginBottom: '8px' }}>
                <tr>
                  <td style={{ width: '33%', padding: '4px 0' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                      Name:
                    </Text>
                  </td>
                  <td style={{ width: '67%', padding: '4px 0' }}>
                    <Text style={{ fontSize: '14px', color: '#1f2937', margin: '0' }}>
                      {firstName} {lastName}
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                      Email:
                    </Text>
                  </td>
                  <td style={{ padding: '4px 0' }}>
                    <Text style={{ fontSize: '14px', color: '#2563eb', margin: '0' }}>
                      {email}
                    </Text>
                  </td>
                </tr>
                {phone && (
                  <tr>
                    <td style={{ padding: '4px 0' }}>
                      <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                        Phone:
                      </Text>
                    </td>
                    <td style={{ padding: '4px 0' }}>
                      <Text style={{ fontSize: '14px', color: '#1f2937', margin: '0' }}>
                        {phone}
                      </Text>
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '4px 0' }}>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                      Account:
                    </Text>
                  </td>
                  <td style={{ padding: '4px 0' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: isRegisteredUser ? '#dbeafe' : '#f3f4f6',
                      color: isRegisteredUser ? '#1e40af' : '#374151'
                    }}>
                      {isRegisteredUser ? 'Registered User' : 'Guest User'}
                    </span>
                  </td>
                </tr>
              </table>
            </Section>

            <Hr style={{ margin: '0 24px', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            {/* Service Requirements */}
            <Section style={{ padding: '16px 24px' }}>
              <Heading style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 12px 0'
              }}>
                📋 Service Requirements
              </Heading>

              <div style={{ marginBottom: '16px' }}>
                <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 4px 0' }}>
                  Focus Areas:
                </Text>
                <div>
                  {resumeFocusAreas.map((area, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginRight: '4px',
                      marginBottom: '4px'
                    }}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 4px 0' }}>
                  Target Job Titles:
                </Text>
                <div>
                  {jobTitles.map((title, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginRight: '4px',
                      marginBottom: '4px'
                    }}>
                      {title}
                    </span>
                  ))}
                </div>
              </div>

              {experience && (
                <div style={{ marginBottom: '16px' }}>
                  <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 4px 0' }}>
                    Experience Level:
                  </Text>
                  <Text style={{ fontSize: '14px', color: '#1f2937', margin: '0' }}>
                    {experience}
                  </Text>
                </div>
              )}
            </Section>

            {/* Resume File */}
            {resumeFileName ? (
              <Section style={{
                padding: '16px 24px',
                backgroundColor: '#eff6ff',
                borderTop: '1px solid #bfdbfe'
              }}>
                <Heading style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 12px 0'
                }}>
                  📄 Resume File
                </Heading>
                <div style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <Text style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                    Filename:
                  </Text>
                  <Text style={{ fontSize: '14px', color: '#1f2937', margin: '0 0 12px 0' }}>
                    {resumeFileName}
                  </Text>

                  {resumeDownloadUrl ? (
                    <Button
                      href={resumeDownloadUrl}
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      📥 Download Resume
                    </Button>
                  ) : (
                    <div>
                      <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                        S3 Key:
                      </Text>
                      <Text style={{
                        fontSize: '12px',
                        color: '#374151',
                        fontFamily: 'monospace',
                        backgroundColor: '#f3f4f6',
                        padding: '4px',
                        borderRadius: '4px',
                        margin: '0'
                      }}>
                        {resumeFileKey}
                      </Text>
                    </div>
                  )}
                </div>
              </Section>
            ) : (
              <Section style={{
                padding: '16px 24px',
                backgroundColor: '#fef7ed',
                borderTop: '1px solid #fed7aa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text style={{ color: '#9a3412', fontWeight: '600', margin: '0' }}>
                    ⚠️ No resume file uploaded
                  </Text>
                </div>
              </Section>
            )}

            {/* Additional Information */}
            {additionalInfo && (
              <Section style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Heading style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 12px 0'
                }}>
                  💬 Additional Information
                </Heading>
                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                  <Text style={{
                    fontSize: '14px',
                    color: '#374151',
                    margin: '0',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {additionalInfo}
                  </Text>
                </div>
              </Section>
            )}

            {/* Payment Information */}
            <Section style={{
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Heading style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 12px 0'
              }}>
                💳 Payment Information
              </Heading>

              <table style={{ width: '100%' }}>
                {stripeSessionId && (
                  <tr>
                    <td style={{ width: '33%', padding: '4px 0', verticalAlign: 'top' }}>
                      <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                        Session ID:
                      </Text>
                    </td>
                    <td style={{ width: '67%', padding: '4px 0' }}>
                      <Text style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        backgroundColor: '#f3f4f6',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#374151',
                        margin: '0'
                      }}>
                        {stripeSessionId}
                      </Text>
                    </td>
                  </tr>
                )}
                {stripePaymentIntentId && (
                  <tr>
                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                      <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                        Payment Intent:
                      </Text>
                    </td>
                    <td style={{ padding: '4px 0' }}>
                      <Text style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        backgroundColor: '#f3f4f6',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#374151',
                        margin: '0'
                      }}>
                        {stripePaymentIntentId}
                      </Text>
                    </td>
                  </tr>
                )}
                {paidAt && (
                  <tr>
                    <td style={{ padding: '4px 0' }}>
                      <Text style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', margin: '0' }}>
                        Paid At:
                      </Text>
                    </td>
                    <td style={{ padding: '4px 0' }}>
                      <Text style={{ fontSize: '14px', color: '#1f2937', margin: '0' }}>
                        {paidAt.toLocaleString()}
                      </Text>
                    </td>
                  </tr>
                )}
              </table>
            </Section>

            {/* Footer */}
            <Section style={{
              padding: '16px 24px',
              backgroundColor: '#f3f4f6',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                Request submitted through Applify Resume Service
              </Text>
              <Text style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                {new Date().toLocaleString()}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SimpleResumeServiceNotification;