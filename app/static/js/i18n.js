/* i18n - Simple translation system */

const translations = {
    en: {
        nav_register: 'Register',
        nav_export: 'Export',
        nav_settings: 'Settings',
        new_entry: '+ New Entry',
        new_registration: 'New Registration',
        patient_name: 'Patient Name *',
        patient_id: 'Patient ID',
        age: 'Age',
        sex: 'Sex',
        ward: 'Ward',
        clinician: 'Clinician',
        specimen: 'Specimen',
        technician: 'Technician',
        tests_requested: 'Tests Requested',
        cancel: 'Cancel',
        register: 'Register',
        date_from: 'From:',
        date_to: 'To:',
        search_patient: 'Search patient...',
        no_entries: 'No entries for this date range',
        export_data: 'Export Data',
        export_excel: 'Export Excel',
        export_csv: 'Export CSV',
        export_ready: 'Export ready:',
        download: 'Download',
        settings: 'Settings',
        site_config: 'Site Configuration',
        site_name: 'Site Name',
        site_code: 'Site Code',
        language: 'Language',
        save: 'Save',
        test_menu: 'Test Menu',
        order: 'Order',
        code: 'Code',
        category: 'Category',
        type: 'Type',
        active: 'Active'
    },
    fr: {
        nav_register: 'Registre',
        nav_export: 'Exporter',
        nav_settings: 'Parametres',
        new_entry: '+ Nouvelle Entree',
        new_registration: 'Nouvel Enregistrement',
        patient_name: 'Nom du Patient *',
        patient_id: 'ID Patient',
        age: 'Age',
        sex: 'Sexe',
        ward: 'Service',
        clinician: 'Clinicien',
        specimen: 'Echantillon',
        technician: 'Technicien',
        tests_requested: 'Analyses Demandees',
        cancel: 'Annuler',
        register: 'Enregistrer',
        date_from: 'Du :',
        date_to: 'Au :',
        search_patient: 'Rechercher patient...',
        no_entries: 'Aucune entree pour cette periode',
        export_data: 'Exporter les Donnees',
        export_excel: 'Exporter Excel',
        export_csv: 'Exporter CSV',
        export_ready: 'Export pret :',
        download: 'Telecharger',
        settings: 'Parametres',
        site_config: 'Configuration du Site',
        site_name: 'Nom du Site',
        site_code: 'Code Site',
        language: 'Langue',
        save: 'Sauvegarder',
        test_menu: 'Menu des Analyses',
        order: 'Ordre',
        code: 'Code',
        category: 'Categorie',
        type: 'Type',
        active: 'Actif'
    }
};

function applyTranslations(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
    // Update toggle button text
    const toggle = document.getElementById('langToggle');
    if (toggle) toggle.textContent = lang === 'en' ? 'FR' : 'EN';
}

function toggleLang() {
    const current = localStorage.getItem('lang') || 'en';
    const next = current === 'en' ? 'fr' : 'en';
    localStorage.setItem('lang', next);
    applyTranslations(next);
}

document.addEventListener('DOMContentLoaded', () => {
    const lang = localStorage.getItem('lang') || 'en';
    applyTranslations(lang);
});
