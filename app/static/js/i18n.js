/* i18n - English, French, Arabic */

const TRANSLATIONS = {
    en: {
        // Nav
        nav_register: 'Register', nav_reports: 'Reports', nav_export: 'Export', nav_settings: 'Settings',
        // Register page
        today: 'Today', no_samples: 'No samples registered today', tap_to_add: 'Tap the button below to register a new sample',
        patient_info: 'Patient', patient_name: 'Patient Name', age: 'Age', sex: 'Sex', ward: 'Service',
        select_tests: 'Select Tests', confirm: 'Confirm', cancel: 'Cancel', next: 'Next →',
        back: '← Back', register_sample: 'Register Sample', enter_results: 'Enter Results',
        close: 'Close', save_results: 'Save Results', registered: 'Registered!',
        collection_time: 'Collection Time', specimen: 'Specimen', tests: 'Tests',
        // Blood bank
        donors: 'Donors', stock: 'Stock', transfusions: 'Transfusions',
        new_donor: 'New Donor', name: 'Name', contact: 'Contact', blood_group: 'Blood Group',
        new_collection: 'New Collection', volume: 'Volume', screening: 'Screening',
        issue_unit: 'Issue Unit', crossmatch: 'Crossmatch', complete: 'Complete Transfusion',
        adverse_reaction: 'Adverse Reaction?',
        // Equipment
        add_equipment: 'Add Equipment', category: 'Category', model: 'Model',
        serial_number: 'Serial Number', manufacturer: 'Manufacturer', location: 'Location',
        installation_date: 'Installation Date', condition: 'Physical Condition',
        log_maintenance: 'Log Maintenance', maintenance_type: 'Maintenance Type',
        description: 'Description', parts_replaced: 'Parts Replaced', performed_by: 'Performed By',
        next_scheduled: 'Next Scheduled',
        // Actions
        reject_sample: 'Reject Sample', undo_rejection: 'Undo Rejection',
        validate_results: 'Validate Results', history: 'History',
        confirm_critical: 'Confirm Critical Values',
        // Export/Reports
        export_data: 'Export Data', date_from: 'From:', date_to: 'To:',
        export_excel: 'Export Excel', export_csv: 'Export CSV', export_ready: 'Export ready:',
        download: 'Download', settings: 'Settings', site_config: 'Site Configuration',
        site_name: 'Site Name', site_code: 'Site Code', language: 'Language',
        save: 'Save', test_menu: 'Test Menu', order: 'Order', code: 'Code',
        type: 'Type', active: 'Active'
    },
    fr: {
        nav_register: 'Registre', nav_reports: 'Rapports', nav_export: 'Export', nav_settings: 'Paramètres',
        today: "Aujourd'hui", no_samples: "Aucun échantillon enregistré aujourd'hui",
        tap_to_add: "Appuyez sur le bouton ci-dessous pour enregistrer un échantillon",
        patient_info: 'Patient', patient_name: 'Nom du Patient', age: 'Âge', sex: 'Sexe', ward: 'Service',
        select_tests: 'Sélectionner les Tests', confirm: 'Confirmer', cancel: 'Annuler', next: 'Suivant →',
        back: '← Retour', register_sample: "Enregistrer l'Échantillon", enter_results: 'Saisir les Résultats',
        close: 'Fermer', save_results: 'Enregistrer les Résultats', registered: 'Enregistré !',
        collection_time: 'Heure de Prélèvement', specimen: 'Spécimen', tests: 'Tests',
        donors: 'Donneurs', stock: 'Stock', transfusions: 'Transfusions',
        new_donor: 'Nouveau Donneur', name: 'Nom', contact: 'Contact', blood_group: 'Groupe Sanguin',
        new_collection: 'Nouvelle Collecte', volume: 'Volume', screening: 'Dépistage',
        issue_unit: 'Distribuer Poche', crossmatch: 'Épreuve de Compatibilité',
        complete: 'Terminer Transfusion', adverse_reaction: 'Réaction Indésirable ?',
        add_equipment: 'Ajouter Équipement', category: 'Catégorie', model: 'Modèle',
        serial_number: 'Numéro de Série', manufacturer: 'Fabricant', location: 'Emplacement',
        installation_date: "Date d'Installation", condition: 'État Physique',
        log_maintenance: 'Enregistrer Maintenance', maintenance_type: 'Type de Maintenance',
        description: 'Description', parts_replaced: 'Pièces Remplacées', performed_by: 'Réalisé Par',
        next_scheduled: 'Prochaine Échéance',
        reject_sample: "Rejeter l'Échantillon", undo_rejection: 'Annuler le Rejet',
        validate_results: 'Valider les Résultats', history: 'Historique',
        confirm_critical: 'Confirmer Valeurs Critiques',
        export_data: 'Exporter les Données', date_from: 'Du :', date_to: 'Au :',
        export_excel: 'Exporter Excel', export_csv: 'Exporter CSV', export_ready: 'Export prêt :',
        download: 'Télécharger', settings: 'Paramètres', site_config: 'Configuration du Site',
        site_name: 'Nom du Site', site_code: 'Code Site', language: 'Langue',
        save: 'Enregistrer', test_menu: 'Menu des Tests', order: 'Ordre', code: 'Code',
        type: 'Type', active: 'Actif'
    },
    ar: {
        nav_register: 'السجل', nav_reports: 'التقارير', nav_export: 'تصدير', nav_settings: 'إعدادات',
        today: 'اليوم', no_samples: 'لا توجد عينات مسجلة اليوم',
        tap_to_add: 'اضغط على الزر أدناه لتسجيل عينة جديدة',
        patient_info: 'المريض', patient_name: 'اسم المريض', age: 'العمر', sex: 'الجنس', ward: 'القسم',
        select_tests: 'اختيار الفحوصات', confirm: 'تأكيد', cancel: 'إلغاء', next: '← التالي',
        back: 'رجوع →', register_sample: 'تسجيل العينة', enter_results: 'إدخال النتائج',
        close: 'إغلاق', save_results: 'حفظ النتائج', registered: '!تم التسجيل',
        collection_time: 'وقت الجمع', specimen: 'العينة', tests: 'الفحوصات',
        donors: 'المتبرعين', stock: 'المخزون', transfusions: 'نقل الدم',
        new_donor: 'متبرع جديد', name: 'الاسم', contact: 'الاتصال', blood_group: 'فصيلة الدم',
        new_collection: 'جمع جديد', volume: 'الحجم', screening: 'الفحص',
        issue_unit: 'صرف وحدة', crossmatch: 'اختبار التوافق',
        complete: 'إتمام نقل الدم', adverse_reaction: 'تفاعل عكسي؟',
        add_equipment: 'إضافة معدات', category: 'الفئة', model: 'الطراز',
        serial_number: 'الرقم التسلسلي', manufacturer: 'الشركة المصنعة', location: 'الموقع',
        installation_date: 'تاريخ التركيب', condition: 'الحالة',
        log_maintenance: 'تسجيل صيانة', maintenance_type: 'نوع الصيانة',
        description: 'الوصف', parts_replaced: 'القطع المستبدلة', performed_by: 'بواسطة',
        next_scheduled: 'الموعد القادم',
        reject_sample: 'رفض العينة', undo_rejection: 'إلغاء الرفض',
        validate_results: 'اعتماد النتائج', history: 'السجل',
        confirm_critical: 'تأكيد القيم الحرجة',
        export_data: 'تصدير البيانات', date_from: ':من', date_to: ':إلى',
        export_excel: 'تصدير Excel', export_csv: 'تصدير CSV', export_ready: ':التصدير جاهز',
        download: 'تحميل', settings: 'إعدادات', site_config: 'إعدادات الموقع',
        site_name: 'اسم الموقع', site_code: 'رمز الموقع', language: 'اللغة',
        save: 'حفظ', test_menu: 'قائمة الفحوصات', order: 'الترتيب', code: 'الرمز',
        type: 'النوع', active: 'نشط'
    }
};

function getCurrentLang() {
    return localStorage.getItem('lang') || 'en';
}

function setLang(lang) {
    localStorage.setItem('lang', lang);
    applyTranslations();
    // Set text direction for Arabic
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

function t(key) {
    const lang = getCurrentLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) el.textContent = translated;
    });
}

// Apply on load + wire lang buttons
document.addEventListener('DOMContentLoaded', () => {
    const lang = getCurrentLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    applyTranslations();

    // Logo fallback (CSP-safe)
    const logoImg = document.getElementById('appLogoImg');
    const logoText = document.getElementById('appLogoText');
    if (logoImg) {
        logoImg.addEventListener('error', () => {
            logoImg.style.display = 'none';
            if (logoText) logoText.style.display = 'inline';
        });
    }

    // Language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) btn.classList.add('active');
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setLang(btn.dataset.lang);
            // Reload page to re-render dynamic content
            location.reload();
        });
    });
});
