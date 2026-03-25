import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { StaticIssueMap } from "../components/map/IssuesMap";
import { useMutation } from "@tanstack/react-query";
import { createIssueApi } from "../api/issues"
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export function ReportIssuePage() {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<"road" | "water" | "lighting" | "waste" | "safety"| "other" | "">("");
    const [description, setDescription] = useState("");
    const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
    const [locationLabel, setLocationLabel] = useState("Click on map");
    const [mapCenter, setMapCenter] = useState<{ lat:number; lng:number } | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();
    const [photo,setPhoto] = useState<File | null>(null);

    const createMutation=useMutation({
        mutationFn: createIssueApi,
        onSuccess: () => {
            setTitle("");
            setCategory("");
            setDescription("");
            setSelectedCoords(null);
            setLocationLabel("Click on map");
            setShowSuccessModal(true);
        },
        onError: (error) => {
            console.error(error);
            alert("Failed to create issue");
        }
    });

    useEffect(() => {
        if(!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setMapCenter({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            },
            () => {
                setMapCenter({ lat: 43.238949, lng: 76.889709})
            }
        );
    }, [])

    async function handleMapClick(coords: {lat:number; lng:number }) {
        setSelectedCoords(coords);
        try{
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
            );
            const data = await res.json();

            const road = data.address?.road || data.address?.pedestrian || data.address?.residential;
            const house = data.address?.house_number;
            if (data?.display_name){
                setLocationLabel(house ? `${road} ${house}` : road);
            } else {
                setLocationLabel("Address not found");
            }
        } catch(e) {
            console.error(e)
            setLocationLabel("Address unavailable")
        }
    }

    function handleSubmit(e : React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !category.trim() || !description.trim()){
            alert("Please fill in all fields");
            return;
        }

        if (!selectedCoords) {
            alert("Please select a location on the map");
            return;
        }

        createMutation.mutate({
            title,
            description,
            category: category as "road" | "water" | "lighting" | "waste" | "safety" | "other",
            lat: selectedCoords.lat,
            lng: selectedCoords.lng,
            photo
        })
    }
   

    return (
        <>
            <div className="space-y-6">
                <PageHeader
                    title="Issue Report"
                    subtitle="Mark the problem on the map and send the full report to the city team."
                />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_370px]">
                    <div className="rounded-[28px] bg-white shadow-sm overflow-hidden">
                        <div className="relative">
                            <StaticIssueMap center={mapCenter} selectedCoords={selectedCoords} onMapClick={handleMapClick} />
                            
                            <div className="absolute left-8 top-8 z-[1000]">
                                <p className="mb-2 text-[20px] font-semibold text-[#3a3a3a]">
                                    Location:
                                </p>
                                <div className="rounded-[16px] bg-[#4A4A4A] px-4 py-3 shadow-lg backdrop-blur-sm border border-white/60">
                                    <p className="text-[15px] leading-6 text-[#FFFFFF] break-words">
                                        {locationLabel}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-[20px] border border-[#7186a5] bg-white px-8 py-10 shadow-sm">
                        <div className="text-center">
                            <h2 className="text-[22px] font-extrabold uppercase text-[#2f2f2f]">
                                REPORT IN ISSUE
                            </h2>
                            <p className="mx-auto mt-3 max-w-[240px] text-[16px] leading-6 text-[#4b4b4b]">
                                Fill in the details and select the problem location
                            </p>
                        </div>

                        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="mb-2 block text-[16px] text-[#3a3a3a]">
                                    Title:
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Issue Title"
                                    className="h-[48px] w-full rounded-[6px] bg-[#4a4a4a] px-4 text-[16px] text-white placeholder:text-[#d1d1d1] outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-[16px] text-[#3a3a3a]">
                                    Category:
                                </label>
                                <div className='relative'>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as any)}
                                        className="h-[48px] w-full rounded-[6px] bg-[#4a4a4a] px-4 text-[16px] text-white placeholder:text-[#d1d1d1] outline-none"
                                    >
                                        <option value="">Select a Category</option>
                                        <option value="road">Road issue</option>
                                        <option value="lighting">Streetlight</option>
                                        <option value="waste">Waste</option>
                                        <option value="water">Water leak</option>
                                    </select>
                                    <ChevronDown
                                        size={18}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-[16px] text-[#3a3a3a]">
                                    Description:
                                </label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Issue Description..."
                                    className="h-[140px] w-full resize-none rounded-[6px] bg-[#4a4a4a] px-4 py-3 text-[16px] text-white placeholder:text-[#d1d1d1] outline-none"
                                />
                            </div>

                            <div className="pt-3 text-center">
                                <button
                                    type="button"
                                    className="h-[44px] w-[180px] rounded-[8px] bg-[#4a4a4a] text-[16px] text-white transition hover:opacity-90"
                                >
                                    Upload Photo
                                </button>    
                            </div> 

                            <div>
                                <label className="mb-2 block text-[16px] text-[#3a3a3a]">
                                    Photo:
                                </label>
                                <input 
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm"
                                />
                            </div>

                            <div className="pt-1 text-center">
                                <button 
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="h-[44px] w-[180px] rounded-[8px] bg-[#12966b] text-[16px] font-medium text-white transition hover:opacity-90"
                                >
                                    {createMutation.isPending ? "Submitting" : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {showSuccessModal ? (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/10 px-4">
                    <div className="relative w-full max-w-[1050px] rounded-[18px] border border-[#ABABAB] bg-white px-8 py-16 shadow-[0_20px_60px_rgba(0,0,0,0.15)] sm:px-14">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#02C173]">
                                <Check size={40} className="text-white" strokeWidth={4} />
                            </div>
                            <h2 className="mt-10 text-[52px] font-medium leading-none text-[#444A59]">
                                Thank You!
                            </h2>
                            <p className="mt-4 text-[20px] text-[#666B78]">
                                Your report has been submitted
                            </p>

                            <div className="mt-14 flex flex-col items-center gap-5 sm:flex-row">
                                <Link
                                    to="/myReport"
                                    className="flex h-[60px] min-w-[240px] items-center justify-center rounded-full bg-[#444A59] px-8 text-[20px] font-medium text-white transition hover:opacity-90"
                                >
                                    View My Reports
                                </Link>

                                <button 
                                    type="button" 
                                    onClick={() => navigate("/map")}
                                    className="flex h-[60px] min-w-[240px] items-center justify-center rounded-full border border-[#444A59] bg-white px-8 text-[20px] font-medium text-[#444A59] transition hover:bg-slate-50"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
    </> 
    )
}

