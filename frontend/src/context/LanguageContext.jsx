/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react';

const translations = {
    EN: {
        "services_title": "Government Services, From Home.",
        "services_subtitle": "Access 50+ government services in one place — apply, track status, and get real-time exam updates with Krishna E-Mitra.",
        "apply_now": "Apply Now",
        "telegram_bot": "Telegram Bot",
        "total_students": "Students Registered",
        "sarkari_sevaen": "Sarkari Sevaen",
        "digital_process": "Digital Process",
        "search_placeholder": "Search services (e.g. janam praman)..",
        "whatsapp_help": "WhatsApp Help",
        "services_nav": "Services",
        "track_status": "Track Status",
        "ready_to_go": "Ready to go digital?",
        "open_telegram": "Open Telegram Bot"
    },
    HI: {
        "services_title": "सरकारी सेवाएँ, अब घर बैठे।",
        "services_subtitle": "एक ही जगह पर 50+ सरकारी सेवाओं का लाभ उठाएं — आवेदन करें, स्थिति ट्रैक करें, और अद्यतन प्राप्त करें।",
        "apply_now": "अभी आवेदन करें",
        "telegram_bot": "टेलीग्राम बॉट",
        "total_students": "पंजीकृत छात्र",
        "sarkari_sevaen": "सरकारी सेवाएँ",
        "digital_process": "डिजिटल प्रक्रिया",
        "search_placeholder": "सेवाएं खोजें (उदा. जन्म प्रमाण)..",
        "whatsapp_help": "व्हाट्सएप सहायता",
        "services_nav": "सेवाएं",
        "track_status": "स्थिति ट्रैक करें",
        "ready_to_go": "क्या आप डिजिटल होने के लिए तैयार हैं?",
        "open_telegram": "टेलीग्राम बॉट खोलें"
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState('EN');

    const toggleLanguage = () => {
        setLang(prev => prev === 'EN' ? 'HI' : 'EN');
    };

    React.useEffect(() => {
        document.documentElement.lang = lang === 'HI' ? 'hi' : 'en';
    }, [lang]);

    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
