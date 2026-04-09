import { Link } from "react-router-dom";
import logo from "../../assets/branding/logo.svg";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#2B2B2B]/10 bg-[#FFFFFF]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-12 lg:grid-cols-4 lg:px-10">
        <div>
          <img src={logo} alt="FixMyCity" className="h-10 w-auto object-contain" />
          <p className="mt-4 max-w-[320px] text-sm leading-6 text-black/70">
            The Smart City Issue Reporting Platform enables citizens to report urban
            infrastructure problems and helps municipal authorities manage and analyze
            issues more efficiently through centralized workflows and spatial analytics.
          </p>
          <p className="mt-8 text-xs text-black/45">Copyright © 2026 FixMyCity</p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#2E2E5A]">Navigation</h4>
          <div className="mt-4 space-y-3 text-sm text-black/75">
            <Link to="/" className="block hover:text-black">Home</Link>
            <Link to="/login" className="block hover:text-black">Report an Issue</Link>
            <Link to="/login" className="block hover:text-black">My Reports</Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#2E2E5A]">Legal</h4>
          <div className="mt-4 space-y-3 text-sm text-black/75">
            <a href="#" className="block hover:text-black">Terms &amp; Conditions</a>
            <a href="#" className="block hover:text-black">Privacy Policy</a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#2E2E5A]">Follow Us</h4>
          <div className="mt-4 space-y-3 text-sm text-black/75">
            <a href="#" className="block hover:text-black">Facebook</a>
            <a href="#" className="block hover:text-black">Twitter</a>
            <a href="#" className="block hover:text-black">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
