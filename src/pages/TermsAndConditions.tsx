import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsAndConditions = () => {
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
              Terms and Conditions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-6 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using APISentry ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground mb-2">
                  APISentry is an API security platform that provides:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Web Application Firewall (WAF) rules and threat protection</li>
                  <li>API endpoint monitoring and analytics</li>
                  <li>Threat detection and blocking capabilities</li>
                  <li>IP blacklist management</li>
                  <li>Security alerts and incident management</li>
                  <li>Code review and vulnerability scanning</li>
                  <li>Integration with third-party services (GitHub, Bitbucket, etc.)</li>
                  <li>Audit logging and compliance features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts and Registration</h2>
                <p className="text-muted-foreground mb-2">
                  To use the Service, you must:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and update your registration information to keep it accurate</li>
                  <li>Maintain the security of your password and identification</li>
                  <li>Accept all responsibility for activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
                <p className="text-muted-foreground mb-2">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit any malicious code, viruses, or harmful data</li>
                  <li>Attempt to gain unauthorized access to any part of the Service</li>
                  <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li>Use automated systems to access the Service without authorization</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Third-Party Integrations</h2>
                <p className="text-muted-foreground">
                  The Service may integrate with third-party services such as GitHub, Bitbucket, and other platforms. By connecting these services, you grant us permission to access and use your data from these services as necessary to provide the Service. You are responsible for ensuring you have the right to grant such permissions and for complying with the terms of service of these third-party platforms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data and Content</h2>
                <p className="text-muted-foreground mb-2">
                  You retain all rights to your data and content. By using the Service, you grant us:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>A license to use, store, and process your data to provide the Service</li>
                  <li>Permission to analyze your data to improve security detection and prevention</li>
                  <li>The right to aggregate and anonymize data for service improvement purposes</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  You are responsible for ensuring that any data you upload or process through the Service complies with applicable laws and does not infringe upon the rights of others.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Service Availability</h2>
                <p className="text-muted-foreground">
                  We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Security and Protection</h2>
                <p className="text-muted-foreground">
                  While we implement industry-standard security measures, you acknowledge that no system is completely secure. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We are not liable for any loss or damage arising from unauthorized access to your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  The Service, including its original content, features, and functionality, is owned by APISentry and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, APISentry shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold harmless APISentry, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the Service, violation of these Terms, or infringement of any rights of another.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through appropriate legal channels.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">15. Contact Information</h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms and Conditions, please contact us through the support channels provided in the Service.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;

