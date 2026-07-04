import React from 'react';

const AnnouncementTicker = ({ announcements }) => {
    if (!announcements || announcements.length === 0) return null
    return (
        <div className="bg-black text-white py-2 overflow-hidden border-y border-white/10 relative">
            <div className="animate-marquee flex">
                {announcements.map((a, i) => (
                    <span key={i} className="mx-8 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
                        <span className="text-[#CFCFCD] mr-2">●</span> {a.title}: {a.content}
                    </span>
                ))}
                {/* Duplicate for seamless loop */}
                {announcements.map((a, i) => (
                    <span key={`dup-${i}`} className="mx-8 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
                        <span className="text-[#CFCFCD] mr-2">●</span> {a.title}: {a.content}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default AnnouncementTicker;
