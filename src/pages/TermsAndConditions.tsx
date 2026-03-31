import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsAndConditions = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute -bottom-24 -right-16 h-[24rem] w-[24rem] rounded-full bg-blue-300/30 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/register">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-700 hover:bg-white/50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-sky-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registration
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader className="px-8 pt-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-lg shadow-blue-500/30">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Terms and Conditions
            </CardTitle>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Last Updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="space-y-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing and using Smartcomply Heimdall ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  2. Description of Service
                </h2>
                <p className="mb-2">
                  Smartcomply Heimdall is an API security platform that provides:
                </p>
                <ul className="list-disc space-y-1 pl-6">
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
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  3. User Accounts and Registration
                </h2>
                <p className="mb-2">
                  To use the Service, you must:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and update your registration information to keep it accurate</li>
                  <li>Maintain the security of your password and identification</li>
                  <li>Accept all responsibility for activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  4. Acceptable Use
                </h2>
                <p className="mb-2">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc space-y-1 pl-6">
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
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  5. Third-Party Integrations
                </h2>
                <p>
                  The Service may integrate with third-party services such as GitHub, Bitbucket, and other platforms. By connecting these services, you grant us permission to access and use your data from these services as necessary to provide the Service. You are responsible for ensuring you have the right to grant such permissions and for complying with the terms of service of these third-party platforms.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  6. Data and Content
                </h2>
                <p className="mb-2">
                  You retain all rights to your data and content. By using the Service, you grant us:
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>A license to use, store, and process your data to provide the Service</li>
                  <li>Permission to analyze your data to improve security detection and prevention</li>
                  <li>The right to aggregate and anonymize data for service improvement purposes</li>
                </ul>
                <p className="mt-2">
                  You are responsible for ensuring that any data you upload or process through the Service complies with applicable laws and does not infringe upon the rights of others.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  7. Service Availability
                </h2>
                <p>
                  We strive to maintain high availability of the Service but do not guarantee uninterrupted access. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  8. Security and Protection
                </h2>
                <p>
                  While we implement industry-standard security measures, you acknowledge that no system is completely secure. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. We are not liable for any loss or damage arising from unauthorized access to your account.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  9. Intellectual Property
                </h2>
                <p>
                  The Service, including its original content, features, and functionality, is owned by Smartcomply Heimdall and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  10. Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by law, Smartcomply Heimdall shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  11. Indemnification
                </h2>
                <p>
                  You agree to indemnify and hold harmless Smartcomply Heimdall, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the Service, violation of these Terms, or infringement of any rights of another.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  12. Termination
                </h2>
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  13. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  14. Governing Law
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through appropriate legal channels.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
                  15. Contact Information
                </h2>
                <p>
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
