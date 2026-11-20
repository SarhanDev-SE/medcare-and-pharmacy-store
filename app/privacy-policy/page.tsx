'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';

const LEGAL_SECTIONS = [
  { id: 'terms', label: '1. Terms' },
  { id: 'limitations', label: '2. Limitations' },
  { id: 'revisions', label: '3. Revisions and errata' },
  { id: 'modifications', label: '4. Site terms of use' },
  { id: 'risks', label: '5. Risks' },
];

export default function PrivacyPolicyPage() {
  const { settings } = useStore();
  const [activeId, setActiveId] = useState<string>('terms');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0.1 }
    );

    LEGAL_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="bg-white pb-16">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
        title="Privacy Policy"
        subtitle="Learn how we protect your medical data, prescriptions, and personal wellness records with transparent practices."
      />

      <div className="max-w-[1320px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sticky Legal TOC */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28">
            <nav aria-label="Legal sections" className="border-l border-slate-200">
              {LEGAL_SECTIONS.map((sec) => {
                const isActive = activeId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`block w-full text-left pl-4 py-2.5 text-sm transition-colors -ml-px border-l-2 cursor-pointer ${
                      isActive
                        ? 'border-[#7B3CA1] text-[#7B3CA1] font-semibold'
                        : 'border-transparent text-slate-600 hover:text-[#082A66]'
                    }`}
                  >
                    {sec.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Right Terms & Privacy Body */}
          <article className="lg:col-span-9 space-y-10 max-w-3xl">
            <h2 className="text-2xl font-bold text-[#082A66]">Terms Of Use</h2>

            <section id="terms" className="scroll-mt-28 space-y-3">
              <h3 className="text-lg font-bold text-[#082A66]">1. Terms</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                By accessing and placing orders through Xmedcar Online Pharmacy &amp; Wellness, you agree to be bound by these Terms of Use, all applicable federal and state pharmacy regulations, and our HIPAA-aligned Privacy Notice. If you do not agree with any part of these terms, please refrain from submitting prescriptions or purchasing regulated health products on this platform.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Over-the-counter wellness supplements, diagnostic devices, and prescription fulfillment services displayed on Xmedcar are intended for lawful personal use by adults aged 18 and older (or by legal guardians ordering pediatric formulas). Prescription orders require valid clinician authorization verified by a licensed Xmedcar pharmacist prior to dispatch.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                All uploaded prescription documents (PDF, PNG, JPG) are encrypted in transit and stored solely for clinical verification, dosage confirmation, and statutory pharmacy recordkeeping.
              </p>
            </section>

            <section id="limitations" className="scroll-mt-28 space-y-3">
              <h3 className="text-lg font-bold text-[#082A66]">2. Limitations</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                In no event shall Xmedcar, its licensed partner pharmacies, or its manufacturing suppliers be liable for damages arising from misuse of supplements, failure to follow labeled dosage instructions, or delayed carrier delivery caused by incomplete shipping details.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 leading-relaxed">
                <li>
                  Product descriptions, composition breakdowns, and herbal monographs are educational and do not replace an in-person diagnosis from your primary care physician.
                </li>
                <li>
                  Temperature-controlled formulations must be stored promptly according to package guidelines upon courier arrival.
                </li>
                <li>
                  Auto-refill subscriptions (30-day, 60-day, or 90-day cycles) may be paused, adjusted, or cancelled at any time prior to the scheduled renewal billing date inside your Account portal.
                </li>
              </ul>
              <p className="text-sm leading-relaxed text-slate-600">
                Certain jurisdictions do not allow limitations on implied warranties; in those jurisdictions, our liability is limited to the fullest extent permitted by applicable law.
              </p>
            </section>

            <section id="revisions" className="scroll-mt-28 space-y-3">
              <h3 className="text-lg font-bold text-[#082A66]">3. Revisions And Errata</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Clinical packaging, lot expiration dates, inactive excipients, and manufacturer formulations occasionally update without prior notice. While our pharmacy cataloging team verifies specifications continuously, Xmedcar does not warrant that every digital product sheet is free from typographical or manufacturer label updates.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Always read the physical label, warning box, and Supplement Facts panel printed on your delivered bottle before administering any capsule, gummy, or liquid drop, especially when managing food allergies or prescription interactions.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Xmedcar reserves the right to correct pricing inaccuracies or discontinue limited-lot formulas at any time prior to order confirmation.
              </p>
            </section>

            <section id="modifications" className="scroll-mt-28 space-y-3">
              <h3 className="text-lg font-bold text-[#082A66]">4. Site Terms Of Use Modifications</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Xmedcar may revise these Terms of Use and Privacy commitments periodically to reflect updated healthcare privacy standards, cold-chain courier protocols, or automated subscription features.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 leading-relaxed">
                <li>
                  We never sell, rent, or trade your prescription history, diagnosis notes, or billing profile to third-party marketing brokers.
                </li>
                <li>
                  Session and cart preferences remain locally preserved so returning customers can review pending prescription uploads without losing items.
                </li>
                <li>
                  Account holders may request export or permanent deletion of stored non-statutory account records via our Privacy Desk at {settings.email}.
                </li>
              </ul>
              <p className="text-sm leading-relaxed text-slate-600">
                Continued use of the storefront after updated terms are posted constitutes acceptance of the revised policy.
              </p>
            </section>

            <section id="risks" className="scroll-mt-28 space-y-3">
              <h3 className="text-lg font-bold text-[#082A66]">5. Risks</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Herbal extracts, concentrated fat-soluble vitamins, and over-the-counter therapeutics carry biological activity and may interact with prescription anticoagulants, antihypertensives, immunosuppressants, or endocrine medications.
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                If you experience an adverse reaction, rash, dizziness, or unexpected symptom after taking any product purchased from Xmedcar, discontinue use immediately and contact your physician or emergency medical services. Non-urgent clinical questions can be directed 24/7 to our licensed pharmacist desk at {settings.phone}.
              </p>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
