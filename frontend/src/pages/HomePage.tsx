import { Link } from "react-router-dom";

import logo from "../assets/branding/logo.svg";

import heroMap from "../assets/landing/hero-map.png";
import stepLocation from "../assets/landing/step-location.png";
import stepForm from "../assets/landing/step-form.png";
import stepTrack from "../assets/landing/step-track.png";

import reviewMap from "../assets/landing/review-map.jpg";
import reviewCity from "../assets/landing/review-city.jpg";
import reviewMonitor from "../assets/landing/review-monitor.jpg";
import reviewDashboard from "../assets/landing/review-dashboard.jpg";

export function HomePage() {
    return (
        <div className="min-h-screen bg-[#F2F5F8] text-[#202020]">
            <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 lg:px-10">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="FixMyCity" className="h-14 w-auto object-contain" />
                </div>
                <nav className="hidden items-center gap-10 text-[14px] text-black/80 md:flex">
                    <a href="#home" className="hover:text-black">
                        Home
                    </a>
                    <a href="#how-it-works" className="hover:text-black">
                        How it works?
                    </a>
                    <a href="#analytics" className="hover:text-black">
                        Analytics / Transparency
                    </a>
                    <Link to="/login" className="hover:text-black">
                        Login
                    </Link>
                </nav>
                <div className="text-xl text-black/70">◦</div>
            </header>
            <main className="mx-auto w-full max-w-[1600px]">
                <section
                    id="home"
                    className="relative flex flex-col items-center px-6 pb-16 pt-8 text-center lg:px-10"
                >
                    <img
                        src={heroMap}
                        alt="Smart City issue reporting"
                        className="w-full max-w-[900px] object-contain"
                    />
                    
                    <div className="absolute top-[110px] flex max-w-[780px] flex-col items-center px-4">
                        <h1 className="text-4xl font-extrabold leading-none tracking-tight sm:text-5xl lg:text-[76px]">
                            Smart City Issue
                            <br />
                            Reporting Platform
                        </h1>
                        <p className="mt-6 max-w-[650px] text-sm leading-6 text-black/75 sm:text-base">
                            Help improve your city by reporting infrastracture issues with precise
                            locations, photos, and descriptions. Track the progress of your reports and
                            support faster response from municipal services.    
                        </p>

                        <Link
                            to="/login"
                            className="mt-6 rounded-full bg-[#2E2E5A] px-10 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#202020]"
                        >
                            Report an issue
                        </Link>
                    </div>
                </section>

                <section className="px-6 py-16 lg:px-10">
                    <h2 className="text-center text-3xl font-extrabold">What is this platform?</h2>
                    <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                        <FeatureCard
                            title="Report Issues"
                            text="Easily report urban infrastracture problems by selecting a location on the map and providing a short description and photo."
                        />
                        <FeatureCard
                            title="Track Status"
                            text="Monitor the progress of tour reports in real time and stay informed about each stage of the resolution process."
                        />
                        <FeatureCard
                            title="Department Assignment"
                            text="Smart routing hekps direct submitted issues to the responsible municipal departments for faster handling."
                        />
                        <FeatureCard
                            title="Department Accountability"
                            text="Transparent workflows help identity problem hotspots and support better monitoring of urban infrastructure."
                        />
                    </div>
                </section>
                
                <section id="how-it-works" className="px-6 py-16 lg:px-10">
                    <h2 className="text-center text-3xl font-extrabold">How it works</h2>
                    <div className="mt-16 flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
                        <StepCard image={stepLocation} title="Choose Location" />
                        <div className="text-3xl text-black/70">→</div>
                        <StepCard image={stepForm} title="Descrive The Problem" />
                        <div className="text-3xl text-black/70">→</div>
                        <StepCard image={stepTrack} title="TitleProgress" />
                    </div>
                </section>

                <section id="analytics" className="overflow-x-clip px-6 py-16 lg:px-10">
                    <h2 className="text-center text-3xl font-extrabold">Our Client Reviews</h2>

                    <div className="mt-16 space-y-20">
                        <div className="grid items-center gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-5 lg:-translate-x-6">
                                <img
                                    src={reviewMap}
                                    alt="Transparency"
                                    className="w-full max-w-[420px] rounded-[18px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                                />
                            </div>

                            <div className="lg:col-span-4 lg:col-start-7 lg:-translate-y-3">
                                <h3 className="text-4xl font-extrabold">Transparency</h3>
                                <p className="mt-4 text-base leading-7 text-black/70">
                                    Citizenst can see how issues are processed and track the progress of each report.
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid items-center gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-4 lg:col-start-2 lg:translate-y-6 lg:-translate-x-10">
                                <h3 className="text-4xl font-extrabold">Faster Response</h3>
                                <p className="mt-4 text-base leading-7 text-black/70">
                                    Automated routing and centralized reporting help city departments respond to
                                    problems more quickly.
                                </p>
                            </div>
                            
                            <div className="lg:col-span-5 lg:col-start-8 lg:translate-x-12">
                                <img
                                    src={reviewCity}
                                    alt="Faster Response"
                                    className="w-full max-w-[420px] rounded-[18px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                                />
                            </div>
                        </div>
                        <div className="grid items-center gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-5 lg:-translate-x-10">
                                <img
                                src={reviewMonitor}
                                alt="Better City Monitoring"
                                className="w-full max-w-[420px] rounded-[18px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                                />
                            </div>

                            <div className="lg:col-span-4 lg:col-start-7 lg:col-start-7 lg:translate-y-2">
                                <h3 className="text-4xl font-extrabold">Better City Monitoring</h3>
                                <p className="mt-4 text-base leading-7 text-black/70">
                                Aggregated data and spatial insights allow authorities to monitor infrastructure
                                issues across the city.
                                </p>
                            </div>
                            </div>

                            <div className="grid items-center gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-4 lg:col-start-2 lg:translate-y-8 lg:-translate-x-8">
                                <h3 className="text-4xl font-extrabold">Data-Driven Decisions</h3>
                                <p className="mt-4 text-base leading-7 text-black/70">
                                Analytics and statistics help city officials prioritize resources and improve
                                service efficiency.
                                </p>
                            </div>

                            <div className="lg:col-span-5 lg:col-start-8 lg:translate-x-16 lg:translate-y-10">
                                <img
                                src={reviewDashboard}
                                alt="Data-Driven Decisions"
                                className="w-full max-w-[420px] rounded-[18px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-20 border-t border-[#2B2B2B]/10 bg-[#FFFFFF]">
                <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-14 lg:grid-cols-4 lg:px-10">
                    <div>
                        <h3 className="text-3xl font-extrabold">FixMyCity</h3>
                        <p className="mt-4 max-w-[320px] text-sm leading-6 text-black/70">
                            The Smart City Issue Reporting Platform enables 
                            citizens to report urban infrastructure problems
                            and helps municipal authorities manage and analyze
                            issues more efficiently through centralized workflows
                            and spatial analytics.
                        </p>
                        <p className="mt-10 text-xs text-black/45">Copyright © 2026</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[#2E2E5A]">Navigation</h4>
                        <div className="mt-4 space-y-3 text-sm text-black/75">
                            <a href="#home" className="block hover:text-black">Home</a>
                            <Link to ="/login" className="block hover:text-black">Report an issue</Link>
                            <Link to="/map" className="block hover:text-black">My reports</Link>    
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[#2E2E5A]">Legal</h4>
                        <div className="mt-4 space-y-3 text-sm text-black/75">
                            <a href="#" className="block hover:text-black">Terms & Conditions</a>
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
        </div>
    );
}

function FeatureCard({ title, text }: { title:string; text:string }) {
    return (
        <div className="min-w-0 text-left">
            <h3 className="text-[20px] font-bold">{title}</h3>
            <p className="m-3 text-sm leading-6 text-black/65">{text}</p>
        </div>
    );
}

function StepCard({ image, title}: { image: string; title: string}){
    return (
        <div className="flex w-[180px] flex-col items-center text-center">
            <img src={image} alt={title} className="h-[140px] w-auto object-contain" />
            <p className="mt-4 text-lg font-semibold">{title} </p>
        </div>
    )
}

function ReviewRow({image, title, text, imageLeft = false }: { image:string; title:string; text:string; imageLeft?:boolean;}){
    return (
        <div className="grid items-center gap-10 lg:grid-cols-2">
            {imageLeft? (
                <>
                    <div className="flex justify-start">
                        <img
                            src={image}
                            alt={title}
                            className="w-full max-w-[500px] rounded-[18px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                        />
                    </div>
                    
                    <div className="max-w-[420px] text-left">
                        <h3 className="text-4xl font-extrabold">{title}</h3>
                        <p className="mt-5 text-base leading-7 text-black/70">{text}</p>
                    </div>
                </>
            ) : (
                <>
                    <div className="max-w-[420px] justify-self-start text-left lg:ml-16">
                        <h3 className="text-4xl font-extrabold">{title}</h3>
                        <p className="mt-5 text-base leading-7 text-black/70">{text}</p>
                    </div>
                    
                    <div className="flex justify-end">
                        <img
                            src={image}
                            alt={title}
                            className="w-full max-w-[500px] rounded-[18px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
