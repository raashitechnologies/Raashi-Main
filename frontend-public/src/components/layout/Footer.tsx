import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa";
import { useDomains } from "@/contexts/DomainsProvider";
import { useContentContext } from "@/contexts/ContentProvider";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Domains", href: "/domains" },
  { label: "Internships", href: "/internships" },
  { label: "Careers", href: "/careers" },
  { label: "Contact Us", href: "/contact" },
];

const socials = [
  { icon: FaLinkedinIn, label: "LinkedIn", href: "https://www.linkedin.com/in/abhishek-gornale/" },
  { icon: Mail, label: "Gmail", href: "mailto:raashitechnologies@gmail.com" },
];

export function Footer() {
  const { domains } = useDomains();
  const { getContent } = useContentContext();
  const contactInfo = getContent("contact_info");
  const phone = contactInfo?.phone || "+91 9742419316";
  const email = contactInfo?.email || "raashitechnologies@gmail.com";
  const address = contactInfo?.address || "69, CTS NO.4482B/67, Shruti Layout, Kanabargi Road, Belgaum Fort, Belgaum – 590016, Karnataka";
  const hours = contactInfo?.hours || "Mon – Sat: 9:00 AM – 6:00 PM\nSunday: Closed";

  return (
    <footer className="bg-brand-navy" role="contentinfo">
      <div className="section-container pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* Col 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center mb-4 group bg-white rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow" aria-label="Raashi Cognitive Technologies home">
              <img src="/logo.png" alt="Raashi Cognitive Technologies" className="h-14 w-auto object-contain" />
            </Link>
            <p className="text-sm text-white/80 leading-relaxed mb-5 max-w-xs">
              Transforming knowledge into intelligent solutions and helping businesses build a smarter future.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <Icon size={15} style={{ color: '#4A90D9' }} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 hover:text-brand-orange transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Our Domains */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-4">
              Our Domains
            </h3>
            <ul className="space-y-2.5">
              {domains.map((d) => (
                <li key={d.slug}>
                  <Link
                    to={`/domains/${d.slug}`}
                    className="text-sm text-white/70 hover:text-brand-orange transition-colors"
                  >
                    {d.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3.5">
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-brand-orange transition-colors"
                >
                  <Phone size={14} className="mt-0.5 shrink-0 text-brand-orange" strokeWidth={1.8} />
                  {phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-2.5 text-sm text-white/70 hover:text-brand-orange transition-colors break-all"
                >
                  <Mail size={14} className="mt-0.5 shrink-0 text-brand-orange" strokeWidth={1.8} />
                  {email}
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2.5 text-sm text-white/70">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-brand-orange" strokeWidth={1.8} />
                  <span>{address}</span>
                </div>
              </li>
              <li className="text-xs text-white/60 pl-[22px]">
                {hours.split('\n').map((line: string, i: number) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/50 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Raashi Cognitive Technologies Pvt. Ltd. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/privacy-policy"
                className="text-xs text-white/50 hover:text-brand-orange transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-white/20 text-xs">|</span>
              <Link
                to="/terms"
                className="text-xs text-white/50 hover:text-brand-orange transition-colors"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
