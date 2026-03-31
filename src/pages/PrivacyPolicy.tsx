import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/register">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
              Privacy Policy
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-6 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
                <p className="text-muted-foreground">
                  SmartComply Heimdall ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our API security platform and services (the "Service"). Please read this Privacy Policy carefully. By using the Service, you consent to the data practices described in this policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
                
                <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Personal Information</h3>
                <p className="text-muted-foreground mb-2">
                  When you register for an account, we collect:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Name (first name and last name)</li>
                  <li>Email address</li>
                  <li>Password (stored in encrypted form)</li>
                  <li>Phone number (optional)</li>
                  <li>Company name (optional)</li>
                  <li>Username</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Usage Data</h3>
                <p className="text-muted-foreground mb-2">
                  We automatically collect information about how you use the Service, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>API request logs and traffic data</li>
                  <li>Threat detection events and security incidents</li>
                  <li>Platform and endpoint analytics</li>
                  <li>WAF rule triggers and blocking events</li>
                  <li>IP addresses and geolocation data</li>
                  <li>User agent information</li>
                  <li>Response times and error rates</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">2.3 Integration Data</h3>
                <p className="text-muted-foreground mb-2">
                  When you connect third-party services, we may collect:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>GitHub/Bitbucket repository information</li>
                  <li>Code review scan results</li>
                  <li>Vulnerability scan data</li>
                  <li>Collection files (Postman, OpenAPI, etc.)</li>
                  <li>Integration configuration settings</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">2.4 Technical Information</h3>
                <p className="text-muted-foreground mb-2">
                  We collect technical information including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Log files and error reports</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-2">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>To provide, maintain, and improve the Service</li>
                  <li>To process your registration and manage your account</li>
                  <li>To detect and prevent security threats and attacks</li>
                  <li>To analyze API traffic and generate security reports</li>
                  <li>To send you security alerts and notifications</li>
                  <li>To perform code reviews and vulnerability scans</li>
                  <li>To provide customer support and respond to inquiries</li>
                  <li>To comply with legal obligations and enforce our Terms</li>
                  <li>To conduct research and analytics to improve our services</li>
                  <li>To send administrative information and updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground mb-2">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                
                <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Service Providers</h3>
                <p className="text-muted-foreground">
                  We may share information with third-party service providers who perform services on our behalf, such as cloud hosting, analytics, and customer support. These providers are contractually obligated to protect your information.
                </p>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Legal Requirements</h3>
                <p className="text-muted-foreground">
                  We may disclose information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
                </p>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Business Transfers</h3>
                <p className="text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership.
                </p>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.4 Aggregated Data</h3>
                <p className="text-muted-foreground">
                  We may share aggregated, anonymized data that does not identify you personally for research, analytics, or business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your information, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication and access controls</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response and breach notification procedures</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or regulatory purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Your Rights and Choices</h2>
                <p className="text-muted-foreground mb-2">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Objection:</strong> Object to certain processing of your information</li>
                  <li><strong>Restriction:</strong> Request restriction of processing your information</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  To exercise these rights, please contact us through the support channels provided in the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to track activity on our Service and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
                <p className="text-muted-foreground">
                  Our Service may contain links to third-party websites or integrate with third-party services (such as GitHub, Bitbucket, Slack, Microsoft Teams). We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any information to them.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using the Service, you consent to the transfer of your information to these countries.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically for any changes. Your continued use of the Service after any modifications constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through the support channels provided in the Service.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

