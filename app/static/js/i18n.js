/* i18n - English, French, Arabic */

const TRANSLATIONS = {
    en: {
        // Nav
        nav_register: 'Register', nav_worklist: 'Worklist', nav_equipment: 'Equipment', nav_reports: 'Reports',
        nav_patients: 'Patients', nav_bloodbank: 'Blood Bank', nav_export: 'Export', nav_settings: 'Settings',

        // Common
        cancel: 'Cancel', close: 'Close', save: 'Save', confirm: 'Confirm', delete_: 'Delete',
        add: 'Add', edit: 'Edit', error: 'Error', failed: 'Failed', loading: 'Loading...',
        yes: 'Yes', no: 'No', ok: 'OK', search: 'Search', download: 'Download', print: 'Print',
        next: 'Next \u2192', back: '\u2190 Back', name: 'Name', age: 'Age', sex: 'Sex',
        contact: 'Contact', ward: 'Service', blood_group: 'Blood Group',

        // Register page
        today: 'Today', no_samples: 'No samples registered today',
        tap_to_add: 'Tap the button below to register a new sample',
        patient_info: 'Patient', patient_name: 'Patient Name',
        select_tests: 'Select Tests',
        register_sample: 'Register Sample', enter_results: 'Enter Results',
        save_results: 'Save Results', registered: 'Registered!',
        collection_time: 'Collection Time', now: 'NOW', specimen: 'Specimen', tests: 'Tests',
        all_entries: 'All entries',
        reg_validate: 'Validate', reg_print: 'Print',
        reg_critical_detected: 'CRITICAL VALUES DETECTED',
        reg_verified_critical: 'I have verified these critical values',
        reg_go_back: 'Go Back', reg_confirm_save: 'Confirm & Save',
        reg_select_reason: 'Select rejection reason:',
        reg_confirm_rejection: 'Confirm Rejection',
        reg_integrity_ok: 'Integrity: OK', reg_integrity_tampered: 'INTEGRITY: TAMPERED',
        reg_integrity_none: 'No integrity data',
        reg_no_audit: 'No audit history (created before audit was enabled)',
        reg_saved: 'Saved', reg_validated: 'Validated', reg_restored: 'Restored',
        reg_rejected: 'REJECTED', reg_samples: 'sample(s)',
        reg_previous: 'Previous', reg_four_eyes: 'Four-eyes rule: you cannot validate your own entry',
        reject_sample: 'Reject Sample', undo_rejection: 'Undo Rejection',
        validate_results: 'Validate Results', history: 'History',
        confirm_critical: 'Confirm Critical Values',

        // Rejection reasons
        rej_hemolyzed: 'Hemolyzed', rej_clotted: 'Clotted', rej_qns: 'QNS',
        rej_unlabelled: 'Unlabelled', rej_wrong_container: 'Wrong container',
        rej_inadequate_volume: 'Inadequate volume', rej_improper_sampling: 'Improper sampling',
        rej_sample_too_old: 'Sample too old', rej_iv_access_site: 'IV access site',

        // Worklist
        wl_waiting: 'Waiting', wl_inprogress: 'In progress', wl_review: 'Review',
        wl_completed: 'Completed', wl_all: 'All', wl_empty: 'No pending samples',
        wl_show_all: 'Show all', wl_my_work: 'My work',

        // Blood bank
        donors: 'Donors', stock: 'Stock', transfusions: 'Transfusions',
        new_donor: 'New Donor', register_donor: 'Register Donor',
        new_collection: 'New Collection', volume: 'Volume', volume_ml: 'Volume (ml)',
        screening: 'Screening', issue_unit: 'Issue Unit', register_unit: 'Register Unit',
        crossmatch: 'Crossmatch', complete_transfusion: 'Complete Transfusion',
        adverse_reaction: 'Adverse Reaction?', adverse_reaction_badge: 'ADVERSE REACTION',
        bb_no_donors: 'No donors registered', bb_no_units: 'No blood units in stock',
        bb_no_transfusions: 'No transfusion records',
        bb_donor_search: 'Donor (search)', bb_type_donor_name: 'Type donor name...',
        bb_available_unit: 'Available Unit', bb_no_available: 'No available units',
        bb_patient_name: 'Patient Name', bb_patient_bg: 'Patient Blood Group',
        bb_compatible: 'COMPATIBLE', bb_incompatible: 'INCOMPATIBLE',
        bb_days_left: 'd left', bb_last: 'Last',
        bb_donor: 'Donor', bb_exp: 'Exp', bb_issued: 'Issued',
        bb_unit: 'Unit', bb_patient: 'Patient',
        bb_screening_label: 'Screening',
        bb_avail: 'AVAIL', bb_rsrvd: 'RSRVD', bb_issued_col: 'ISSUED', bb_exprd: 'EXPRD', bb_exp_7d: 'EXP<7d',

        // Equipment
        add_equipment: 'Add Equipment', category: 'Category', model: 'Model',
        serial_number: 'Serial Number', manufacturer: 'Manufacturer', location: 'Location',
        installation_date: 'Installation Date', condition: 'Physical Condition',
        log_maintenance: 'Log Maintenance', maintenance_type: 'Maintenance Type',
        description: 'Description', parts_replaced: 'Parts Replaced', performed_by: 'Performed By',
        next_scheduled: 'Next Scheduled', name_desc: 'Name / Description',
        eq_no_equipment: 'No equipment registered', eq_no_maintenance: 'No maintenance records',
        eq_maintenance_log: 'Maintenance Log', eq_last: 'Last', eq_next: 'Next', eq_overdue: 'OVERDUE',
        eq_by: 'By', eq_parts: 'Parts',
        // Equipment categories
        eq_cat_freezer: 'Freezer', eq_cat_refrigerator: 'Refrigerator', eq_cat_microscope: 'Microscope',
        eq_cat_centrifuge: 'Centrifuge', eq_cat_analyzer: 'Analyzer', eq_cat_incubator: 'Incubator',
        eq_cat_autoclave: 'Autoclave', eq_cat_balance: 'Balance', eq_cat_timer: 'Timer',
        eq_cat_thermometer: 'Thermometer', eq_cat_pipette: 'Pipette', eq_cat_water_bath: 'Water Bath',
        eq_cat_vortex: 'Vortex', eq_cat_safety_cabinet: 'Safety Cabinet', eq_cat_generator: 'Generator',
        eq_cat_ups: 'UPS', eq_cat_other: 'Other',
        // Equipment conditions
        eq_cond_good: 'Good', eq_cond_fair: 'Fair', eq_cond_poor: 'Poor', eq_cond_out: 'Out of service',
        // Maintenance frequencies
        eq_freq_daily: 'Daily', eq_freq_weekly: 'Weekly', eq_freq_monthly: 'Monthly',
        eq_freq_quarterly: 'Quarterly', eq_freq_yearly: 'Yearly',
        // Maintenance types
        eq_maint_preventive: 'PREVENTIVE', eq_maint_corrective: 'CORRECTIVE', eq_maint_calibration: 'CALIBRATION',

        // Patients
        pat_village: 'Village', pat_contact: 'Contact', pat_registered: 'Registered',
        pat_lab_history: 'Lab History', pat_no_records: 'No lab records',
        pat_no_patients: 'No patients found', pat_search: 'Search by name or patient number...',
        pat_patients: 'Patients',

        // PIN / Onboarding
        pin_enter: 'Enter your PIN', pin_invalid: 'Invalid PIN', pin_unlock: 'Enter PIN to unlock',
        pin_choose: 'Choose a 4\u20138 digit PIN', pin_confirm: 'Confirm your PIN',
        pin_no_match: 'PINs don\u2019t match \u2014 try again', pin_start_over: '\u2190 Start over',
        ob_welcome: 'Welcome to Liminal',
        ob_whats_your_name: 'Let\u2019s set up your laboratory. What\u2019s your name?',
        ob_your_name: 'Your name', ob_continue: 'Continue \u2192',
        ob_hi: 'Hi,', ob_configure: 'Configure your lab', ob_basic_info: 'Basic site information',
        ob_site_name: 'Site Name', ob_site_code: 'Site Code', ob_country: 'Country',
        ob_default_lang: 'Default Language', ob_active_tests: 'Active tests',
        ob_select_tests: 'Select the tests available at this site',
        ob_your_team: 'Your team',
        ob_add_team_hint: 'Add at least one supervisor and one technician',
        ob_add_supervisor: 'Add Supervisor', ob_add_technician: 'Add Technician',
        ob_pin_hint: 'PIN (4-8 digits)', ob_skip: 'Skip for now',
        ob_is_ready: 'is ready', ob_site: 'Site', ob_code: 'Code',
        ob_tests_count: 'active test', ob_ops_count: 'operator', ob_created: 'created',
        ob_start_using: 'Start using Liminal \u2192',

        // Settings / Backup
        settings: 'Settings', site_config: 'Site Configuration',
        site_name: 'Site Name', site_code: 'Site Code', language: 'Language',
        test_menu: 'Test Menu', order: 'Order', code: 'Code', type: 'Type', active: 'Active',
        set_no_backups: 'No backups yet.', set_file: 'File', set_size: 'Size', set_date: 'Date',
        set_select_db: 'Please select a .db file first.',
        set_restore_title: 'Restore database?',
        set_restore_msg: 'This will <b>replace all current data</b> with the backup file. This cannot be undone.',
        set_restore: 'Restore', set_restore_failed: 'Restore failed',

        // Printing
        set_printing: 'Printing', set_result_report: 'Result Report', set_specimen_labels: 'Specimen Labels',
        set_show_barcode: 'Show barcode on report', set_show_signatures: 'Show signature lines',
        set_footer_text: 'Footer text', set_footer_placeholder: 'e.g. laboratory address, phone...',
        set_label_format: 'Label format', set_copies: 'Copies per specimen',
        set_label_fields: 'Fields on label',
        set_field_barcode: 'Barcode', set_field_patient: 'Patient name', set_field_specimen: 'Specimen type',
        set_field_date: 'Collection date', set_field_time: 'Collection time',
        set_save_print: 'Save', set_print_saved: 'Print settings saved.',
        set_labels_enabled: 'Enable specimen labels',
        reg_print_labels: 'Labels',
        set_format_2x7: 'Standard 2\u00d77 (Avery L7163)', set_format_3x8: 'Small 3\u00d78 (Avery L7157)',
        set_format_single: 'Single (test)',

        // Export / Reports
        export_data: 'Export Data', date_from: 'From:', date_to: 'To:',
        export_excel: 'Export Excel', export_csv: 'Export CSV', export_ready: 'Export ready:',
        rpt_monthly: 'Monthly Report', rpt_month: 'Month', rpt_year: 'Year',
        rpt_generate: 'Generate PDF Report', rpt_download: 'Download PDF',
        rpt_samples: 'samples', rpt_tests: 'tests', rpt_rejection_rate: 'rejection rate',

        // Landing page
        land_tagline: 'Laboratory Information at the Threshold',
        land_featuring: 'Featuring',
        land_laboratory: 'Laboratory',
        land_lab_1: 'Structured result entry \u2014 CBC, malaria, urinalysis',
        land_lab_2: 'Patient history and trend tracking',
        land_lab_3: 'Panic value alerts on critical results',
        land_blood_bank: 'Blood Bank',
        land_bb_1: 'Donor register, stock and expiry tracking',
        land_bb_2: 'Crossmatch and transfusion workflow',
        land_quality: 'Quality',
        land_q_1: 'Sample rejection workflow \u2014 9 constrained reasons',
        land_q_2: 'Four-eyes validation \u2014 operator \u2260 validator',
        land_q_3: 'ISO 15189 compliant audit trail',
        land_security: 'Security',
        land_s_1: 'Zero-trust PIN per action \u2014 no sessions',
        land_s_2: 'AES-256 encryption, SHA-256 integrity',
        land_s_3: 'Tamper-proof record hashing',
        land_reporting: 'Reporting',
        land_r_1: 'Monthly sitrep \u2014 volumes, positivity rates',
        land_r_2: 'Excel / CSV export',
        land_equipment: 'Equipment',
        land_e_1: 'Maintenance log \u2014 WHO LQSI categories',
        land_e_2: 'Preventive, corrective, calibration tracking',
        land_localization: 'Localization',
        land_l_1: 'Multilingual \u2014 English, French, Arabic',
        land_l_2: 'RTL support',
        land_field: 'Field-ready',
        land_f_1: 'Air-gapped \u2014 zero network dependency',
        land_f_2: 'Portable \u2014 USB stick, no install',
        land_f_3: 'Barcode scanner ready \u2014 Code 128 HID',

        // API errors
        err_auth_required: 'Authentication required',
        err_invalid_pin: 'Invalid PIN',
        err_level_required: 'Insufficient access level',
        err_setup_done: 'Setup already completed',
        err_access_denied: 'Access denied',
        err_name_required: 'Name is required',
        err_invalid_level: 'Invalid level',
        err_operator_not_found: 'Operator not found',
        err_patient_name_required: 'Patient name is required',
        err_invalid_sex: 'Invalid sex value',
        err_invalid_age: 'Invalid age',
        err_no_tests: 'No recognized test codes in payload',
        err_invalid_rejection: 'Invalid rejection reason',
        err_not_found: 'Entry not found',
        err_must_be_review: 'Entry must be in REVIEW status to validate',
        err_not_rejected: 'Entry is not rejected',
        err_cannot_modify: 'Cannot modify results on this entry',
        err_lab_number_retry: 'Could not generate unique lab number, please retry',
        err_invalid_blood_group: 'Invalid blood group',
        err_unit_not_found: 'Unit not found',
        err_invalid_status: 'Invalid status',
        err_unit_unavailable: 'Unit is not available',
        err_unit_expired: 'Unit has expired',
        err_incompatible_xm: 'Cannot issue unit with incompatible crossmatch',
        err_transfusion_not_found: 'Transfusion not found',
        err_equipment_not_found: 'Equipment not found',
        err_no_fields: 'No fields to update',
        err_invalid_maint_type: 'Invalid maintenance type',
        err_invalid_condition: 'Invalid condition',
        err_patient_not_found: 'Patient not found',
        err_active_tests_list: 'active_tests must be a list',
        err_no_site_config: 'No site config found',
        err_field_empty: 'Field cannot be empty',
        err_site_code_length: 'Site code must be 3-5 characters',
        err_db_not_found: 'Database not found',
        err_invalid_filename: 'Invalid filename',
        err_backup_not_found: 'Backup not found',
        err_no_file: 'No file uploaded',
        err_no_file_selected: 'No file selected',
        err_invalid_db: 'Invalid SQLite database',
        err_invalid_db_table: 'Invalid database: lab_register table not found',
        err_invalid_month: 'Invalid month',
        err_invalid_year: 'Invalid year or month',
        err_four_eyes: 'Same operator cannot enter and validate results'
    },

    fr: {
        // Nav
        nav_register: 'Registre', nav_worklist: 'Travail', nav_equipment: '\u00c9quip.', nav_reports: 'Rapports',
        nav_patients: 'Patients', nav_bloodbank: 'Sang', nav_export: 'Export', nav_settings: 'Config',

        // Common
        cancel: 'Annuler', close: 'Fermer', save: 'Enregistrer', confirm: 'Confirmer', delete_: 'Supprimer',
        add: 'Ajouter', edit: 'Modifier', error: 'Erreur', failed: '\u00c9chou\u00e9', loading: 'Chargement...',
        yes: 'Oui', no: 'Non', ok: 'OK', search: 'Rechercher', download: 'T\u00e9l\u00e9charger', print: 'Imprimer',
        next: 'Suivant \u2192', back: '\u2190 Retour', name: 'Nom', age: '\u00c2ge', sex: 'Sexe',
        contact: 'Contact', ward: 'Service', blood_group: 'Groupe Sanguin',

        // Register page
        today: "Aujourd'hui", no_samples: "Aucun \u00e9chantillon enregistr\u00e9 aujourd'hui",
        tap_to_add: "Appuyez sur le bouton ci-dessous pour enregistrer un \u00e9chantillon",
        patient_info: 'Patient', patient_name: 'Nom du Patient',
        select_tests: 'S\u00e9lectionner les Tests',
        register_sample: "Enregistrer l'\u00c9chantillon", enter_results: 'Saisir les R\u00e9sultats',
        save_results: 'Enregistrer les R\u00e9sultats', registered: 'Enregistr\u00e9 !',
        collection_time: 'Heure de Pr\u00e9l\u00e8vement', now: 'MAINTENANT', specimen: 'Sp\u00e9cimen', tests: 'Tests',
        all_entries: 'Toutes les entr\u00e9es',
        reg_validate: 'Valider', reg_print: 'Imprimer',
        reg_critical_detected: 'VALEURS CRITIQUES D\u00c9TECT\u00c9ES',
        reg_verified_critical: "J'ai v\u00e9rifi\u00e9 ces valeurs critiques",
        reg_go_back: 'Retour', reg_confirm_save: 'Confirmer et Enregistrer',
        reg_select_reason: 'S\u00e9lectionner la raison du rejet :',
        reg_confirm_rejection: 'Confirmer le Rejet',
        reg_integrity_ok: 'Int\u00e9grit\u00e9 : OK', reg_integrity_tampered: 'INT\u00c9GRIT\u00c9 : FALSIFI\u00c9',
        reg_integrity_none: "Pas de donn\u00e9es d'int\u00e9grit\u00e9",
        reg_no_audit: "Pas d'historique d'audit (cr\u00e9\u00e9 avant l'activation de l'audit)",
        reg_saved: 'Enregistr\u00e9', reg_validated: 'Valid\u00e9', reg_restored: 'R\u00e9tabli',
        reg_rejected: 'REJET\u00c9', reg_samples: '\u00e9chantillon(s)',
        reg_previous: 'Pr\u00e9c\u00e9dent', reg_four_eyes: 'R\u00e8gle des quatre yeux : vous ne pouvez pas valider votre propre saisie',
        reject_sample: "Rejeter l'\u00c9chantillon", undo_rejection: 'Annuler le Rejet',
        validate_results: 'Valider les R\u00e9sultats', history: 'Historique',
        confirm_critical: 'Confirmer Valeurs Critiques',

        // Rejection reasons
        rej_hemolyzed: 'H\u00e9molys\u00e9', rej_clotted: 'Coagul\u00e9', rej_qns: 'QNS',
        rej_unlabelled: 'Non \u00e9tiquet\u00e9', rej_wrong_container: 'Mauvais contenant',
        rej_inadequate_volume: 'Volume insuffisant', rej_improper_sampling: 'Pr\u00e9l\u00e8vement incorrect',
        rej_sample_too_old: '\u00c9chantillon trop ancien', rej_iv_access_site: 'Site de perfusion IV',

        // Worklist
        wl_waiting: 'En attente', wl_inprogress: 'En cours', wl_review: 'Validation',
        wl_completed: 'Termin\u00e9s', wl_all: 'Tous', wl_empty: 'Aucun \u00e9chantillon en attente',
        wl_show_all: 'Voir tout', wl_my_work: 'Mon travail',

        // Blood bank
        donors: 'Donneurs', stock: 'Stock', transfusions: 'Transfusions',
        new_donor: 'Nouveau Donneur', register_donor: 'Enregistrer Donneur',
        new_collection: 'Nouvelle Collecte', volume: 'Volume', volume_ml: 'Volume (ml)',
        screening: 'D\u00e9pistage', issue_unit: 'Distribuer Poche', register_unit: 'Enregistrer Poche',
        crossmatch: '\u00c9preuve de Compatibilit\u00e9', complete_transfusion: 'Terminer Transfusion',
        adverse_reaction: 'R\u00e9action Ind\u00e9sirable ?', adverse_reaction_badge: 'R\u00c9ACTION IND\u00c9SIRABLE',
        bb_no_donors: 'Aucun donneur enregistr\u00e9', bb_no_units: 'Aucune poche en stock',
        bb_no_transfusions: 'Aucune transfusion enregistr\u00e9e',
        bb_donor_search: 'Donneur (recherche)', bb_type_donor_name: 'Nom du donneur...',
        bb_available_unit: 'Poche Disponible', bb_no_available: 'Aucune poche disponible',
        bb_patient_name: 'Nom du Patient', bb_patient_bg: 'Groupe Sanguin du Patient',
        bb_compatible: 'COMPATIBLE', bb_incompatible: 'INCOMPATIBLE',
        bb_days_left: 'j restants', bb_last: 'Dernier',
        bb_donor: 'Donneur', bb_exp: 'Exp', bb_issued: 'Distribu\u00e9',
        bb_unit: 'Poche', bb_patient: 'Patient',
        bb_screening_label: 'D\u00e9pistage',
        bb_avail: 'DISPO', bb_rsrvd: 'R\u00c9SRV', bb_issued_col: 'DISTR', bb_exprd: 'EXPIR', bb_exp_7d: 'EXP<7j',

        // Equipment
        add_equipment: 'Ajouter \u00c9quipement', category: 'Cat\u00e9gorie', model: 'Mod\u00e8le',
        serial_number: 'Num\u00e9ro de S\u00e9rie', manufacturer: 'Fabricant', location: 'Emplacement',
        installation_date: "Date d'Installation", condition: '\u00c9tat Physique',
        log_maintenance: 'Enregistrer Maintenance', maintenance_type: 'Type de Maintenance',
        description: 'Description', parts_replaced: 'Pi\u00e8ces Remplac\u00e9es', performed_by: 'R\u00e9alis\u00e9 Par',
        next_scheduled: 'Prochaine \u00c9ch\u00e9ance', name_desc: 'Nom / Description',
        eq_no_equipment: 'Aucun \u00e9quipement enregistr\u00e9', eq_no_maintenance: "Aucun enregistrement de maintenance",
        eq_maintenance_log: 'Journal de Maintenance', eq_last: 'Dernier', eq_next: 'Prochain', eq_overdue: 'EN RETARD',
        eq_by: 'Par', eq_parts: 'Pi\u00e8ces',
        // Equipment categories
        eq_cat_freezer: 'Cong\u00e9lateur', eq_cat_refrigerator: 'R\u00e9frig\u00e9rateur', eq_cat_microscope: 'Microscope',
        eq_cat_centrifuge: 'Centrifugeuse', eq_cat_analyzer: 'Analyseur', eq_cat_incubator: 'Incubateur',
        eq_cat_autoclave: 'Autoclave', eq_cat_balance: 'Balance', eq_cat_timer: 'Minuteur',
        eq_cat_thermometer: 'Thermom\u00e8tre', eq_cat_pipette: 'Pipette', eq_cat_water_bath: 'Bain-Marie',
        eq_cat_vortex: 'Vortex', eq_cat_safety_cabinet: 'Hotte de s\u00e9curit\u00e9', eq_cat_generator: 'G\u00e9n\u00e9rateur',
        eq_cat_ups: 'Onduleur', eq_cat_other: 'Autre',
        // Equipment conditions
        eq_cond_good: 'Bon', eq_cond_fair: 'Correct', eq_cond_poor: 'Mauvais', eq_cond_out: 'Hors service',
        // Maintenance frequencies
        eq_freq_daily: 'Quotidien', eq_freq_weekly: 'Hebdomadaire', eq_freq_monthly: 'Mensuel',
        eq_freq_quarterly: 'Trimestriel', eq_freq_yearly: 'Annuel',
        // Maintenance types
        eq_maint_preventive: 'PR\u00c9VENTIVE', eq_maint_corrective: 'CORRECTIVE', eq_maint_calibration: '\u00c9TALONNAGE',

        // Patients
        pat_village: 'Village', pat_contact: 'Contact', pat_registered: 'Enregistr\u00e9',
        pat_lab_history: 'Historique Labo', pat_no_records: 'Aucun r\u00e9sultat',
        pat_no_patients: 'Aucun patient trouv\u00e9', pat_search: 'Rechercher par nom ou num\u00e9ro de patient...',
        pat_patients: 'Patients',

        // PIN / Onboarding
        pin_enter: 'Entrez votre PIN', pin_invalid: 'PIN invalide', pin_unlock: 'Entrez le PIN pour d\u00e9verrouiller',
        pin_choose: 'Choisissez un PIN de 4 \u00e0 8 chiffres', pin_confirm: 'Confirmez votre PIN',
        pin_no_match: 'Les PINs ne correspondent pas \u2014 r\u00e9essayez', pin_start_over: '\u2190 Recommencer',
        ob_welcome: 'Bienvenue sur Liminal',
        ob_whats_your_name: 'Configurons votre laboratoire. Quel est votre nom ?',
        ob_your_name: 'Votre nom', ob_continue: 'Continuer \u2192',
        ob_hi: 'Bonjour,', ob_configure: 'Configurer votre labo', ob_basic_info: 'Informations de base du site',
        ob_site_name: 'Nom du Site', ob_site_code: 'Code Site', ob_country: 'Pays',
        ob_default_lang: 'Langue par d\u00e9faut', ob_active_tests: 'Tests actifs',
        ob_select_tests: 'S\u00e9lectionnez les tests disponibles sur ce site',
        ob_your_team: 'Votre \u00e9quipe',
        ob_add_team_hint: 'Ajoutez au moins un superviseur et un technicien',
        ob_add_supervisor: 'Ajouter Superviseur', ob_add_technician: 'Ajouter Technicien',
        ob_pin_hint: 'PIN (4-8 chiffres)', ob_skip: 'Passer pour le moment',
        ob_is_ready: 'est pr\u00eat', ob_site: 'Site', ob_code: 'Code',
        ob_tests_count: 'test actif', ob_ops_count: 'op\u00e9rateur', ob_created: 'cr\u00e9\u00e9(s)',
        ob_start_using: 'Commencer \u00e0 utiliser Liminal \u2192',

        // Settings / Backup
        settings: 'Param\u00e8tres', site_config: 'Configuration du Site',
        site_name: 'Nom du Site', site_code: 'Code Site', language: 'Langue',
        test_menu: 'Menu des Tests', order: 'Ordre', code: 'Code', type: 'Type', active: 'Actif',
        set_no_backups: 'Aucune sauvegarde.', set_file: 'Fichier', set_size: 'Taille', set_date: 'Date',
        set_select_db: 'Veuillez s\u00e9lectionner un fichier .db.',
        set_restore_title: 'Restaurer la base ?',
        set_restore_msg: 'Ceci va <b>remplacer toutes les donn\u00e9es</b> par le fichier de sauvegarde. Cette action est irr\u00e9versible.',
        set_restore: 'Restaurer', set_restore_failed: '\u00c9chec de la restauration',

        // Printing
        set_printing: 'Impression', set_result_report: 'Rapport de R\u00e9sultats', set_specimen_labels: '\u00c9tiquettes de Sp\u00e9cimens',
        set_show_barcode: 'Afficher le code-barres sur le rapport', set_show_signatures: 'Afficher les lignes de signature',
        set_footer_text: 'Texte de pied de page', set_footer_placeholder: 'ex. adresse du laboratoire, t\u00e9l\u00e9phone...',
        set_label_format: 'Format d\u2019\u00e9tiquettes', set_copies: 'Copies par sp\u00e9cimen',
        set_label_fields: 'Champs sur l\u2019\u00e9tiquette',
        set_field_barcode: 'Code-barres', set_field_patient: 'Nom du patient', set_field_specimen: 'Type de sp\u00e9cimen',
        set_field_date: 'Date de pr\u00e9l\u00e8vement', set_field_time: 'Heure de pr\u00e9l\u00e8vement',
        set_save_print: 'Enregistrer', set_print_saved: 'Param\u00e8tres d\u2019impression enregistr\u00e9s.',
        set_labels_enabled: 'Activer les \u00e9tiquettes de sp\u00e9cimens',
        reg_print_labels: '\u00c9tiquettes',
        set_format_2x7: 'Standard 2\u00d77 (Avery L7163)', set_format_3x8: 'Petit 3\u00d78 (Avery L7157)',
        set_format_single: 'Unique (test)',

        // Export / Reports
        export_data: 'Exporter les Donn\u00e9es', date_from: 'Du :', date_to: 'Au :',
        export_excel: 'Exporter Excel', export_csv: 'Exporter CSV', export_ready: 'Export pr\u00eat :',
        rpt_monthly: 'Rapport Mensuel', rpt_month: 'Mois', rpt_year: 'Ann\u00e9e',
        rpt_generate: 'G\u00e9n\u00e9rer le Rapport PDF', rpt_download: 'T\u00e9l\u00e9charger le PDF',
        rpt_samples: '\u00e9chantillons', rpt_tests: 'tests', rpt_rejection_rate: 'taux de rejet',

        // Landing page
        land_tagline: "L'Information de Laboratoire au Seuil",
        land_featuring: 'Fonctionnalit\u00e9s',
        land_laboratory: 'Laboratoire',
        land_lab_1: 'Saisie structur\u00e9e \u2014 NFS, paludisme, analyse urinaire',
        land_lab_2: 'Historique patient et suivi des tendances',
        land_lab_3: 'Alertes sur valeurs critiques',
        land_blood_bank: 'Banque de Sang',
        land_bb_1: 'Registre donneurs, stock et suivi des p\u00e9remptions',
        land_bb_2: 'Workflow transfusion et compatibilit\u00e9',
        land_quality: 'Qualit\u00e9',
        land_q_1: 'Workflow de rejet \u2014 9 raisons normalis\u00e9es',
        land_q_2: 'Validation quatre yeux \u2014 op\u00e9rateur \u2260 valideur',
        land_q_3: 'Tra\u00e7abilit\u00e9 ISO 15189',
        land_security: 'S\u00e9curit\u00e9',
        land_s_1: 'PIN par action \u2014 z\u00e9ro session',
        land_s_2: 'Chiffrement AES-256, int\u00e9grit\u00e9 SHA-256',
        land_s_3: 'Hachage anti-falsification',
        land_reporting: 'Rapports',
        land_r_1: 'Sitrep mensuel \u2014 volumes, taux de positivit\u00e9',
        land_r_2: 'Export Excel / CSV',
        land_equipment: '\u00c9quipement',
        land_e_1: 'Journal de maintenance \u2014 cat\u00e9gories OMS LQSI',
        land_e_2: 'Suivi pr\u00e9ventif, correctif, \u00e9talonnage',
        land_localization: 'Localisation',
        land_l_1: 'Multilingue \u2014 anglais, fran\u00e7ais, arabe',
        land_l_2: 'Support RTL',
        land_field: 'Terrain',
        land_f_1: 'Hors r\u00e9seau \u2014 z\u00e9ro d\u00e9pendance',
        land_f_2: 'Portable \u2014 cl\u00e9 USB, pas d\u2019installation',
        land_f_3: 'Scanner code-barres \u2014 Code 128 HID',

        // API errors
        err_auth_required: 'Authentification requise',
        err_invalid_pin: 'PIN invalide',
        err_level_required: "Niveau d'acc\u00e8s insuffisant",
        err_setup_done: 'Configuration d\u00e9j\u00e0 effectu\u00e9e',
        err_access_denied: 'Acc\u00e8s refus\u00e9',
        err_name_required: 'Le nom est requis',
        err_invalid_level: 'Niveau invalide',
        err_operator_not_found: 'Op\u00e9rateur non trouv\u00e9',
        err_patient_name_required: 'Le nom du patient est requis',
        err_invalid_sex: 'Valeur de sexe invalide',
        err_invalid_age: '\u00c2ge invalide',
        err_no_tests: 'Aucun code test reconnu',
        err_invalid_rejection: 'Raison de rejet invalide',
        err_not_found: 'Entr\u00e9e non trouv\u00e9e',
        err_must_be_review: "L'entr\u00e9e doit \u00eatre en statut VALIDATION pour valider",
        err_not_rejected: "L'entr\u00e9e n'est pas rejet\u00e9e",
        err_cannot_modify: 'Impossible de modifier les r\u00e9sultats de cette entr\u00e9e',
        err_lab_number_retry: 'Impossible de g\u00e9n\u00e9rer un num\u00e9ro unique, r\u00e9essayez',
        err_invalid_blood_group: 'Groupe sanguin invalide',
        err_unit_not_found: 'Poche non trouv\u00e9e',
        err_invalid_status: 'Statut invalide',
        err_unit_unavailable: "La poche n'est pas disponible",
        err_unit_expired: 'La poche a expir\u00e9',
        err_incompatible_xm: 'Impossible de distribuer une poche avec crossmatch incompatible',
        err_transfusion_not_found: 'Transfusion non trouv\u00e9e',
        err_equipment_not_found: '\u00c9quipement non trouv\u00e9',
        err_no_fields: 'Aucun champ \u00e0 mettre \u00e0 jour',
        err_invalid_maint_type: 'Type de maintenance invalide',
        err_invalid_condition: '\u00c9tat invalide',
        err_patient_not_found: 'Patient non trouv\u00e9',
        err_active_tests_list: 'active_tests doit \u00eatre une liste',
        err_no_site_config: 'Pas de configuration de site',
        err_field_empty: 'Le champ ne peut pas \u00eatre vide',
        err_site_code_length: 'Le code site doit contenir 3 \u00e0 5 caract\u00e8res',
        err_db_not_found: 'Base de donn\u00e9es non trouv\u00e9e',
        err_invalid_filename: 'Nom de fichier invalide',
        err_backup_not_found: 'Sauvegarde non trouv\u00e9e',
        err_no_file: 'Aucun fichier envoy\u00e9',
        err_no_file_selected: 'Aucun fichier s\u00e9lectionn\u00e9',
        err_invalid_db: 'Base de donn\u00e9es SQLite invalide',
        err_invalid_db_table: 'Base invalide : table lab_register introuvable',
        err_invalid_month: 'Mois invalide',
        err_invalid_year: 'Ann\u00e9e ou mois invalide',
        err_four_eyes: 'Le m\u00eame op\u00e9rateur ne peut pas saisir et valider les r\u00e9sultats'
    },

    ar: {
        // Nav
        nav_register: '\u0627\u0644\u0633\u062c\u0644', nav_worklist: '\u0627\u0644\u0645\u0647\u0627\u0645', nav_equipment: '\u0627\u0644\u0645\u0639\u062f\u0627\u062a', nav_reports: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631',
        nav_patients: '\u0627\u0644\u0645\u0631\u0636\u0649', nav_bloodbank: '\u0628\u0646\u0643 \u0627\u0644\u062f\u0645', nav_export: '\u062a\u0635\u062f\u064a\u0631', nav_settings: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a',

        // Common
        cancel: '\u0625\u0644\u063a\u0627\u0621', close: '\u0625\u063a\u0644\u0627\u0642', save: '\u062d\u0641\u0638', confirm: '\u062a\u0623\u0643\u064a\u062f', delete_: '\u062d\u0630\u0641',
        add: '\u0625\u0636\u0627\u0641\u0629', edit: '\u062a\u0639\u062f\u064a\u0644', error: '\u062e\u0637\u0623', failed: '\u0641\u0634\u0644', loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
        yes: '\u0646\u0639\u0645', no: '\u0644\u0627', ok: '\u0645\u0648\u0627\u0641\u0642', search: '\u0628\u062d\u062b', download: '\u062a\u062d\u0645\u064a\u0644', print: '\u0637\u0628\u0627\u0639\u0629',
        next: '\u2190 \u0627\u0644\u062a\u0627\u0644\u064a', back: '\u0631\u062c\u0648\u0639 \u2192', name: '\u0627\u0644\u0627\u0633\u0645', age: '\u0627\u0644\u0639\u0645\u0631', sex: '\u0627\u0644\u062c\u0646\u0633',
        contact: '\u0627\u0644\u0627\u062a\u0635\u0627\u0644', ward: '\u0627\u0644\u0642\u0633\u0645', blood_group: '\u0641\u0635\u064a\u0644\u0629 \u0627\u0644\u062f\u0645',

        // Register page
        today: '\u0627\u0644\u064a\u0648\u0645', no_samples: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u064a\u0646\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u0627\u0644\u064a\u0648\u0645',
        tap_to_add: '\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u062f\u0646\u0627\u0647 \u0644\u062a\u0633\u062c\u064a\u0644 \u0639\u064a\u0646\u0629 \u062c\u062f\u064a\u062f\u0629',
        patient_info: '\u0627\u0644\u0645\u0631\u064a\u0636', patient_name: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u064a\u0636',
        select_tests: '\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0641\u062d\u0648\u0635\u0627\u062a',
        register_sample: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0639\u064a\u0646\u0629', enter_results: '\u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c',
        save_results: '\u062d\u0641\u0638 \u0627\u0644\u0646\u062a\u0627\u0626\u062c', registered: '!\u062a\u0645 \u0627\u0644\u062a\u0633\u062c\u064a\u0644',
        collection_time: '\u0648\u0642\u062a \u0627\u0644\u062c\u0645\u0639', now: '\u0627\u0644\u0622\u0646', specimen: '\u0627\u0644\u0639\u064a\u0646\u0629', tests: '\u0627\u0644\u0641\u062d\u0648\u0635\u0627\u062a',
        all_entries: '\u062c\u0645\u064a\u0639 \u0627\u0644\u0625\u062f\u062e\u0627\u0644\u0627\u062a',
        reg_validate: '\u0627\u0639\u062a\u0645\u0627\u062f', reg_print: '\u0637\u0628\u0627\u0639\u0629',
        reg_critical_detected: '\u062a\u0645 \u0627\u0643\u062a\u0634\u0627\u0641 \u0642\u064a\u0645 \u062d\u0631\u062c\u0629',
        reg_verified_critical: '\u0644\u0642\u062f \u062a\u062d\u0642\u0642\u062a \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u062d\u0631\u062c\u0629',
        reg_go_back: '\u0631\u062c\u0648\u0639', reg_confirm_save: '\u062a\u0623\u0643\u064a\u062f \u0648\u062d\u0641\u0638',
        reg_select_reason: '\u0627\u062e\u062a\u0631 \u0633\u0628\u0628 \u0627\u0644\u0631\u0641\u0636:',
        reg_confirm_rejection: '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0631\u0641\u0636',
        reg_integrity_ok: '\u0627\u0644\u0633\u0644\u0627\u0645\u0629: \u0645\u0648\u0627\u0641\u0642', reg_integrity_tampered: '\u0627\u0644\u0633\u0644\u0627\u0645\u0629: \u0645\u062e\u062a\u0631\u0642',
        reg_integrity_none: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0633\u0644\u0627\u0645\u0629',
        reg_no_audit: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0633\u062c\u0644 \u062a\u062f\u0642\u064a\u0642',
        reg_saved: '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638', reg_validated: '\u062a\u0645 \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f', reg_restored: '\u062a\u0645\u062a \u0627\u0644\u0627\u0633\u062a\u0639\u0627\u062f\u0629',
        reg_rejected: '\u0645\u0631\u0641\u0648\u0636', reg_samples: '\u0639\u064a\u0646\u0629(\u0627\u062a)',
        reg_previous: '\u0627\u0644\u0633\u0627\u0628\u0642', reg_four_eyes: '\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0639\u064a\u0648\u0646 \u0627\u0644\u0623\u0631\u0628\u0639: \u0644\u0627 \u064a\u0645\u0643\u0646\u0643 \u0627\u0639\u062a\u0645\u0627\u062f \u0625\u062f\u062e\u0627\u0644\u0643',
        reject_sample: '\u0631\u0641\u0636 \u0627\u0644\u0639\u064a\u0646\u0629', undo_rejection: '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0631\u0641\u0636',
        validate_results: '\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0646\u062a\u0627\u0626\u062c', history: '\u0627\u0644\u0633\u062c\u0644',
        confirm_critical: '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u062d\u0631\u062c\u0629',

        // Rejection reasons
        rej_hemolyzed: '\u0645\u062a\u062d\u0644\u0644', rej_clotted: '\u0645\u062a\u062e\u062b\u0631', rej_qns: '\u0643\u0645\u064a\u0629 \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0629',
        rej_unlabelled: '\u063a\u064a\u0631 \u0645\u0639\u0644\u0645', rej_wrong_container: '\u062d\u0627\u0648\u064a\u0629 \u062e\u0627\u0637\u0626\u0629',
        rej_inadequate_volume: '\u062d\u062c\u0645 \u063a\u064a\u0631 \u0643\u0627\u0641', rej_improper_sampling: '\u0633\u062d\u0628 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d',
        rej_sample_too_old: '\u0639\u064a\u0646\u0629 \u0642\u062f\u064a\u0645\u0629', rej_iv_access_site: '\u0645\u0648\u0642\u0639 \u0627\u0644\u0648\u0631\u064a\u062f',

        // Worklist
        wl_waiting: '\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631', wl_inprogress: '\u062c\u0627\u0631\u064a', wl_review: '\u0645\u0631\u0627\u062c\u0639\u0629',
        wl_completed: '\u0645\u0643\u062a\u0645\u0644', wl_all: '\u0627\u0644\u0643\u0644', wl_empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u064a\u0646\u0627\u062a \u0645\u0639\u0644\u0642\u0629',
        wl_show_all: '\u0639\u0631\u0636 \u0627\u0644\u0643\u0644', wl_my_work: '\u0639\u0645\u0644\u064a',

        // Blood bank
        donors: '\u0627\u0644\u0645\u062a\u0628\u0631\u0639\u064a\u0646', stock: '\u0627\u0644\u0645\u062e\u0632\u0648\u0646', transfusions: '\u0646\u0642\u0644 \u0627\u0644\u062f\u0645',
        new_donor: '\u0645\u062a\u0628\u0631\u0639 \u062c\u062f\u064a\u062f', register_donor: '\u062a\u0633\u062c\u064a\u0644 \u0645\u062a\u0628\u0631\u0639',
        new_collection: '\u062c\u0645\u0639 \u062c\u062f\u064a\u062f', volume: '\u0627\u0644\u062d\u062c\u0645', volume_ml: '\u0627\u0644\u062d\u062c\u0645 (\u0645\u0644)',
        screening: '\u0627\u0644\u0641\u062d\u0635', issue_unit: '\u0635\u0631\u0641 \u0648\u062d\u062f\u0629', register_unit: '\u062a\u0633\u062c\u064a\u0644 \u0648\u062d\u062f\u0629',
        crossmatch: '\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u062a\u0648\u0627\u0641\u0642', complete_transfusion: '\u0625\u062a\u0645\u0627\u0645 \u0646\u0642\u0644 \u0627\u0644\u062f\u0645',
        adverse_reaction: '\u062a\u0641\u0627\u0639\u0644 \u0639\u0643\u0633\u064a\u061f', adverse_reaction_badge: '\u062a\u0641\u0627\u0639\u0644 \u0639\u0643\u0633\u064a',
        bb_no_donors: '\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u062a\u0628\u0631\u0639\u0648\u0646', bb_no_units: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0648\u062d\u062f\u0627\u062a \u0641\u064a \u0627\u0644\u0645\u062e\u0632\u0648\u0646',
        bb_no_transfusions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a \u0646\u0642\u0644 \u062f\u0645',
        bb_donor_search: '\u0645\u062a\u0628\u0631\u0639 (\u0628\u062d\u062b)', bb_type_donor_name: '\u0627\u0633\u0645 \u0627\u0644\u0645\u062a\u0628\u0631\u0639...',
        bb_available_unit: '\u0648\u062d\u062f\u0629 \u0645\u062a\u0627\u062d\u0629', bb_no_available: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0648\u062d\u062f\u0627\u062a \u0645\u062a\u0627\u062d\u0629',
        bb_patient_name: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u064a\u0636', bb_patient_bg: '\u0641\u0635\u064a\u0644\u0629 \u062f\u0645 \u0627\u0644\u0645\u0631\u064a\u0636',
        bb_compatible: '\u0645\u062a\u0648\u0627\u0641\u0642', bb_incompatible: '\u063a\u064a\u0631 \u0645\u062a\u0648\u0627\u0641\u0642',
        bb_days_left: '\u064a\u0648\u0645 \u0645\u062a\u0628\u0642\u064a', bb_last: '\u0627\u0644\u0623\u062e\u064a\u0631',
        bb_donor: '\u0645\u062a\u0628\u0631\u0639', bb_exp: '\u0627\u0646\u062a\u0647\u0627\u0621', bb_issued: '\u0645\u0648\u0632\u0639',
        bb_unit: '\u0648\u062d\u062f\u0629', bb_patient: '\u0645\u0631\u064a\u0636',
        bb_screening_label: '\u0627\u0644\u0641\u062d\u0635',
        bb_avail: '\u0645\u062a\u0627\u062d', bb_rsrvd: '\u0645\u062d\u062c\u0648\u0632', bb_issued_col: '\u0645\u0648\u0632\u0639', bb_exprd: '\u0645\u0646\u062a\u0647\u064a', bb_exp_7d: '<7\u064a',

        // Equipment
        add_equipment: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0639\u062f\u0627\u062a', category: '\u0627\u0644\u0641\u0626\u0629', model: '\u0627\u0644\u0637\u0631\u0627\u0632',
        serial_number: '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062a\u0633\u0644\u0633\u0644\u064a', manufacturer: '\u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0645\u0635\u0646\u0639\u0629', location: '\u0627\u0644\u0645\u0648\u0642\u0639',
        installation_date: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0631\u0643\u064a\u0628', condition: '\u0627\u0644\u062d\u0627\u0644\u0629',
        log_maintenance: '\u062a\u0633\u062c\u064a\u0644 \u0635\u064a\u0627\u0646\u0629', maintenance_type: '\u0646\u0648\u0639 \u0627\u0644\u0635\u064a\u0627\u0646\u0629',
        description: '\u0627\u0644\u0648\u0635\u0641', parts_replaced: '\u0627\u0644\u0642\u0637\u0639 \u0627\u0644\u0645\u0633\u062a\u0628\u062f\u0644\u0629', performed_by: '\u0628\u0648\u0627\u0633\u0637\u0629',
        next_scheduled: '\u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0642\u0627\u062f\u0645', name_desc: '\u0627\u0644\u0627\u0633\u0645 / \u0627\u0644\u0648\u0635\u0641',
        eq_no_equipment: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0639\u062f\u0627\u062a', eq_no_maintenance: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a \u0635\u064a\u0627\u0646\u0629',
        eq_maintenance_log: '\u0633\u062c\u0644 \u0627\u0644\u0635\u064a\u0627\u0646\u0629', eq_last: '\u0627\u0644\u0623\u062e\u064a\u0631', eq_next: '\u0627\u0644\u0642\u0627\u062f\u0645', eq_overdue: '\u0645\u062a\u0623\u062e\u0631',
        eq_by: '\u0628\u0648\u0627\u0633\u0637\u0629', eq_parts: '\u0642\u0637\u0639',
        // Equipment categories
        eq_cat_freezer: '\u0645\u062c\u0645\u062f', eq_cat_refrigerator: '\u062b\u0644\u0627\u062c\u0629', eq_cat_microscope: '\u0645\u062c\u0647\u0631',
        eq_cat_centrifuge: '\u0637\u0631\u062f \u0645\u0631\u0643\u0632\u064a', eq_cat_analyzer: '\u0645\u062d\u0644\u0644', eq_cat_incubator: '\u062d\u0627\u0636\u0646\u0629',
        eq_cat_autoclave: '\u0645\u0639\u0642\u0645', eq_cat_balance: '\u0645\u064a\u0632\u0627\u0646', eq_cat_timer: '\u0645\u0624\u0642\u062a',
        eq_cat_thermometer: '\u0645\u064a\u0632\u0627\u0646 \u062d\u0631\u0627\u0631\u0629', eq_cat_pipette: '\u0645\u0627\u0635\u0629', eq_cat_water_bath: '\u062d\u0645\u0627\u0645 \u0645\u0627\u0626\u064a',
        eq_cat_vortex: '\u062e\u0644\u0627\u0637', eq_cat_safety_cabinet: '\u062e\u0632\u0627\u0646\u0629 \u0623\u0645\u0627\u0646', eq_cat_generator: '\u0645\u0648\u0644\u062f',
        eq_cat_ups: '\u0645\u0632\u0648\u062f \u0637\u0627\u0642\u0629', eq_cat_other: '\u0623\u062e\u0631\u0649',
        // Equipment conditions
        eq_cond_good: '\u062c\u064a\u062f', eq_cond_fair: '\u0645\u0642\u0628\u0648\u0644', eq_cond_poor: '\u0633\u064a\u0626', eq_cond_out: '\u062e\u0627\u0631\u062c \u0627\u0644\u062e\u062f\u0645\u0629',
        // Maintenance frequencies
        eq_freq_daily: '\u064a\u0648\u0645\u064a', eq_freq_weekly: '\u0623\u0633\u0628\u0648\u0639\u064a', eq_freq_monthly: '\u0634\u0647\u0631\u064a',
        eq_freq_quarterly: '\u0631\u0628\u0639 \u0633\u0646\u0648\u064a', eq_freq_yearly: '\u0633\u0646\u0648\u064a',
        // Maintenance types
        eq_maint_preventive: '\u0648\u0642\u0627\u0626\u064a\u0629', eq_maint_corrective: '\u062a\u0635\u062d\u064a\u062d\u064a\u0629', eq_maint_calibration: '\u0645\u0639\u0627\u064a\u0631\u0629',

        // Patients
        pat_village: '\u0627\u0644\u0642\u0631\u064a\u0629', pat_contact: '\u0627\u0644\u0627\u062a\u0635\u0627\u0644', pat_registered: '\u0645\u0633\u062c\u0644',
        pat_lab_history: '\u0633\u062c\u0644 \u0627\u0644\u0645\u062e\u062a\u0628\u0631', pat_no_records: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a',
        pat_no_patients: '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0645\u0631\u0636\u0649', pat_search: '\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0645\u0631\u064a\u0636...',
        pat_patients: '\u0627\u0644\u0645\u0631\u0636\u0649',

        // PIN / Onboarding
        pin_enter: '\u0623\u062f\u062e\u0644 \u0631\u0645\u0632 PIN', pin_invalid: '\u0631\u0645\u0632 PIN \u063a\u064a\u0631 \u0635\u0627\u0644\u062d', pin_unlock: '\u0623\u062f\u062e\u0644 PIN \u0644\u0644\u0641\u062a\u062d',
        pin_choose: '\u0627\u062e\u062a\u0631 \u0631\u0645\u0632 PIN \u0645\u0646 4 \u0625\u0644\u0649 8 \u0623\u0631\u0642\u0627\u0645', pin_confirm: '\u0623\u0643\u062f \u0631\u0645\u0632 PIN',
        pin_no_match: '\u0631\u0645\u0648\u0632 PIN \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u0629 \u2014 \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649', pin_start_over: '\u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0645\u0646 \u062c\u062f\u064a\u062f \u2192',
        ob_welcome: '\u0645\u0631\u062d\u0628\u0627 \u0628\u0643 \u0641\u064a Liminal',
        ob_whats_your_name: '\u0644\u0646\u0642\u0645 \u0628\u0625\u0639\u062f\u0627\u062f \u0645\u062e\u062a\u0628\u0631\u0643. \u0645\u0627 \u0627\u0633\u0645\u0643\u061f',
        ob_your_name: '\u0627\u0633\u0645\u0643', ob_continue: '\u0645\u062a\u0627\u0628\u0639\u0629 \u2190',
        ob_hi: '\u0645\u0631\u062d\u0628\u0627\u060c', ob_configure: '\u0625\u0639\u062f\u0627\u062f \u0645\u062e\u062a\u0628\u0631\u0643', ob_basic_info: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629',
        ob_site_name: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0642\u0639', ob_site_code: '\u0631\u0645\u0632 \u0627\u0644\u0645\u0648\u0642\u0639', ob_country: '\u0627\u0644\u0628\u0644\u062f',
        ob_default_lang: '\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629', ob_active_tests: '\u0627\u0644\u0641\u062d\u0648\u0635\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629',
        ob_select_tests: '\u062d\u062f\u062f \u0627\u0644\u0641\u062d\u0648\u0635\u0627\u062a \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0642\u0639',
        ob_your_team: '\u0641\u0631\u064a\u0642\u0643',
        ob_add_team_hint: '\u0623\u0636\u0641 \u0645\u0634\u0631\u0641\u0627 \u0648\u0627\u062d\u062f\u0627 \u0648\u0641\u0646\u064a\u0627 \u0648\u0627\u062d\u062f\u0627 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644',
        ob_add_supervisor: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0634\u0631\u0641', ob_add_technician: '\u0625\u0636\u0627\u0641\u0629 \u0641\u0646\u064a',
        ob_pin_hint: 'PIN (4-8 \u0623\u0631\u0642\u0627\u0645)', ob_skip: '\u062a\u062e\u0637\u064a \u0644\u0644\u0622\u0646',
        ob_is_ready: '\u062c\u0627\u0647\u0632', ob_site: '\u0627\u0644\u0645\u0648\u0642\u0639', ob_code: '\u0627\u0644\u0631\u0645\u0632',
        ob_tests_count: '\u0641\u062d\u0635 \u0646\u0634\u0637', ob_ops_count: '\u0645\u0634\u063a\u0644', ob_created: '\u062a\u0645 \u0625\u0646\u0634\u0627\u0624\u0647',
        ob_start_using: '\u0627\u0628\u062f\u0623 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 Liminal \u2190',

        // Settings / Backup
        settings: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a', site_config: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0648\u0642\u0639',
        site_name: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0642\u0639', site_code: '\u0631\u0645\u0632 \u0627\u0644\u0645\u0648\u0642\u0639', language: '\u0627\u0644\u0644\u063a\u0629',
        test_menu: '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0641\u062d\u0648\u0635\u0627\u062a', order: '\u0627\u0644\u062a\u0631\u062a\u064a\u0628', code: '\u0627\u0644\u0631\u0645\u0632', type: '\u0627\u0644\u0646\u0648\u0639', active: '\u0646\u0634\u0637',
        set_no_backups: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0633\u062e \u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629.', set_file: '\u0645\u0644\u0641', set_size: '\u062d\u062c\u0645', set_date: '\u062a\u0627\u0631\u064a\u062e',
        set_select_db: '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0644\u0641 .db \u0623\u0648\u0644\u0627.',
        set_restore_title: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a\u061f',
        set_restore_msg: '\u0633\u064a\u062a\u0645 <b>\u0627\u0633\u062a\u0628\u062f\u0627\u0644 \u062c\u0645\u064a\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a</b> \u0628\u0645\u0644\u0641 \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629. \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.',
        set_restore: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629', set_restore_failed: '\u0641\u0634\u0644 \u0627\u0644\u0627\u0633\u062a\u0639\u0627\u062f\u0629',

        // Printing
        set_printing: '\u0627\u0644\u0637\u0628\u0627\u0639\u0629', set_result_report: '\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0646\u062a\u0627\u0626\u062c', set_specimen_labels: '\u0645\u0644\u0635\u0642\u0627\u062a \u0627\u0644\u0639\u064a\u0646\u0627\u062a',
        set_show_barcode: '\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0634\u0631\u064a\u0637\u064a \u0639\u0644\u0649 \u0627\u0644\u062a\u0642\u0631\u064a\u0631', set_show_signatures: '\u0625\u0638\u0647\u0627\u0631 \u062e\u0637\u0648\u0637 \u0627\u0644\u062a\u0648\u0642\u064a\u0639',
        set_footer_text: '\u0646\u0635 \u0627\u0644\u062a\u0630\u064a\u064a\u0644', set_footer_placeholder: '\u0645\u062b\u0627\u0644: \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u062e\u062a\u0628\u0631\u060c \u0627\u0644\u0647\u0627\u062a\u0641...',
        set_label_format: '\u062a\u0646\u0633\u064a\u0642 \u0627\u0644\u0645\u0644\u0635\u0642\u0627\u062a', set_copies: '\u0646\u0633\u062e \u0644\u0643\u0644 \u0639\u064a\u0646\u0629',
        set_label_fields: '\u062d\u0642\u0648\u0644 \u0627\u0644\u0645\u0644\u0635\u0642',
        set_field_barcode: '\u0631\u0645\u0632 \u0634\u0631\u064a\u0637\u064a', set_field_patient: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u064a\u0636', set_field_specimen: '\u0646\u0648\u0639 \u0627\u0644\u0639\u064a\u0646\u0629',
        set_field_date: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062c\u0645\u0639', set_field_time: '\u0648\u0642\u062a \u0627\u0644\u062c\u0645\u0639',
        set_save_print: '\u062d\u0641\u0638', set_print_saved: '\u062a\u0645 \u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0637\u0628\u0627\u0639\u0629.',
        set_labels_enabled: '\u062a\u0641\u0639\u064a\u0644 \u0645\u0644\u0635\u0642\u0627\u062a \u0627\u0644\u0639\u064a\u0646\u0627\u062a',
        reg_print_labels: '\u0645\u0644\u0635\u0642\u0627\u062a',
        set_format_2x7: '\u0642\u064a\u0627\u0633\u064a 2\u00d77 (Avery L7163)', set_format_3x8: '\u0635\u063a\u064a\u0631 3\u00d78 (Avery L7157)',
        set_format_single: '\u0645\u0641\u0631\u062f (\u0627\u062e\u062a\u0628\u0627\u0631)',

        // Export / Reports
        export_data: '\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a', date_from: ':\u0645\u0646', date_to: ':\u0625\u0644\u0649',
        export_excel: '\u062a\u0635\u062f\u064a\u0631 Excel', export_csv: '\u062a\u0635\u062f\u064a\u0631 CSV', export_ready: ':\u0627\u0644\u062a\u0635\u062f\u064a\u0631 \u062c\u0627\u0647\u0632',
        rpt_monthly: '\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0634\u0647\u0631\u064a', rpt_month: '\u0627\u0644\u0634\u0647\u0631', rpt_year: '\u0627\u0644\u0633\u0646\u0629',
        rpt_generate: '\u0625\u0646\u0634\u0627\u0621 \u062a\u0642\u0631\u064a\u0631 PDF', rpt_download: '\u062a\u062d\u0645\u064a\u0644 PDF',
        rpt_samples: '\u0639\u064a\u0646\u0627\u062a', rpt_tests: '\u0641\u062d\u0648\u0635\u0627\u062a', rpt_rejection_rate: '\u0645\u0639\u062f\u0644 \u0627\u0644\u0631\u0641\u0636',

        // Landing page
        land_tagline: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u062e\u062a\u0628\u0631 \u0639\u0646\u062f \u0627\u0644\u0639\u062a\u0628\u0629',
        land_featuring: '\u0627\u0644\u0645\u0645\u064a\u0632\u0627\u062a',
        land_laboratory: '\u0627\u0644\u0645\u062e\u062a\u0628\u0631',
        land_lab_1: '\u0625\u062f\u062e\u0627\u0644 \u0645\u0646\u0638\u0645 \u2014 \u062a\u0639\u062f\u0627\u062f \u062f\u0645\u060c \u0645\u0644\u0627\u0631\u064a\u0627\u060c \u062a\u062d\u0644\u064a\u0644 \u0628\u0648\u0644',
        land_lab_2: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u0631\u064a\u0636 \u0648\u062a\u062a\u0628\u0639 \u0627\u0644\u0627\u062a\u062c\u0627\u0647\u0627\u062a',
        land_lab_3: '\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u062d\u0631\u062c\u0629',
        land_blood_bank: '\u0628\u0646\u0643 \u0627\u0644\u062f\u0645',
        land_bb_1: '\u0633\u062c\u0644 \u0627\u0644\u0645\u062a\u0628\u0631\u0639\u064a\u0646 \u0648\u062a\u062a\u0628\u0639 \u0627\u0644\u0645\u062e\u0632\u0648\u0646',
        land_bb_2: '\u0633\u064a\u0631 \u0639\u0645\u0644 \u0627\u0644\u062a\u0648\u0627\u0641\u0642 \u0648\u0646\u0642\u0644 \u0627\u0644\u062f\u0645',
        land_quality: '\u0627\u0644\u062c\u0648\u062f\u0629',
        land_q_1: '\u0633\u064a\u0631 \u0639\u0645\u0644 \u0627\u0644\u0631\u0641\u0636 \u2014 9 \u0623\u0633\u0628\u0627\u0628 \u0645\u0642\u064a\u062f\u0629',
        land_q_2: '\u0645\u0635\u0627\u062f\u0642\u0629 \u0631\u0628\u0627\u0639\u064a\u0629 \u0627\u0644\u0639\u064a\u0648\u0646',
        land_q_3: '\u062a\u062f\u0642\u064a\u0642 \u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 ISO 15189',
        land_security: '\u0627\u0644\u0623\u0645\u0627\u0646',
        land_s_1: 'PIN \u0644\u0643\u0644 \u0625\u062c\u0631\u0627\u0621 \u2014 \u0628\u062f\u0648\u0646 \u062c\u0644\u0633\u0627\u062a',
        land_s_2: '\u062a\u0634\u0641\u064a\u0631 AES-256\u060c \u0633\u0644\u0627\u0645\u0629 SHA-256',
        land_s_3: '\u062a\u0648\u0642\u064a\u0639 \u0633\u062c\u0644\u0627\u062a \u0636\u062f \u0627\u0644\u062a\u0644\u0627\u0639\u0628',
        land_reporting: '\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631',
        land_r_1: '\u062a\u0642\u0631\u064a\u0631 \u0634\u0647\u0631\u064a \u2014 \u0623\u062d\u062c\u0627\u0645\u060c \u0645\u0639\u062f\u0644\u0627\u062a',
        land_r_2: '\u062a\u0635\u062f\u064a\u0631 Excel / CSV',
        land_equipment: '\u0627\u0644\u0645\u0639\u062f\u0627\u062a',
        land_e_1: '\u0633\u062c\u0644 \u0635\u064a\u0627\u0646\u0629 \u2014 \u0641\u0626\u0627\u062a OMS LQSI',
        land_e_2: '\u062a\u062a\u0628\u0639 \u0648\u0642\u0627\u0626\u064a\u060c \u062a\u0635\u062d\u064a\u062d\u064a\u060c \u0645\u0639\u0627\u064a\u0631\u0629',
        land_localization: '\u0627\u0644\u062a\u0639\u0631\u064a\u0628',
        land_l_1: '\u0645\u062a\u0639\u062f\u062f \u0627\u0644\u0644\u063a\u0627\u062a \u2014 \u0625\u0646\u062c\u0644\u064a\u0632\u064a\u060c \u0641\u0631\u0646\u0633\u064a\u060c \u0639\u0631\u0628\u064a',
        land_l_2: '\u062f\u0639\u0645 RTL',
        land_field: '\u062c\u0627\u0647\u0632 \u0644\u0644\u0645\u064a\u062f\u0627\u0646',
        land_f_1: '\u0628\u062f\u0648\u0646 \u0634\u0628\u0643\u0629 \u2014 \u0645\u0633\u062a\u0642\u0644 \u062a\u0645\u0627\u0645\u0627',
        land_f_2: '\u0645\u062d\u0645\u0648\u0644 \u2014 USB\u060c \u0628\u062f\u0648\u0646 \u062a\u062b\u0628\u064a\u062a',
        land_f_3: '\u0645\u0627\u0633\u062d \u0631\u0645\u0648\u0632 \u0634\u0631\u064a\u0637\u064a\u0629 \u2014 Code 128 HID',

        // API errors
        err_auth_required: '\u0627\u0644\u0645\u0635\u0627\u062f\u0642\u0629 \u0645\u0637\u0644\u0648\u0628\u0629',
        err_invalid_pin: '\u0631\u0645\u0632 PIN \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_level_required: '\u0645\u0633\u062a\u0648\u0649 \u0648\u0635\u0648\u0644 \u063a\u064a\u0631 \u0643\u0627\u0641',
        err_setup_done: '\u062a\u0645 \u0627\u0644\u0625\u0639\u062f\u0627\u062f \u0645\u0633\u0628\u0642\u0627',
        err_access_denied: '\u062a\u0645 \u0631\u0641\u0636 \u0627\u0644\u0648\u0635\u0648\u0644',
        err_name_required: '\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628',
        err_invalid_level: '\u0645\u0633\u062a\u0648\u0649 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_operator_not_found: '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u063a\u0644',
        err_patient_name_required: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u064a\u0636 \u0645\u0637\u0644\u0648\u0628',
        err_invalid_sex: '\u0642\u064a\u0645\u0629 \u062c\u0646\u0633 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629',
        err_invalid_age: '\u0639\u0645\u0631 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_no_tests: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0631\u0645\u0648\u0632 \u0641\u062d\u0648\u0635\u0627\u062a \u0645\u0639\u0631\u0648\u0641\u0629',
        err_invalid_rejection: '\u0633\u0628\u0628 \u0631\u0641\u0636 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_not_found: '\u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f',
        err_must_be_review: '\u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u0641\u064a \u062d\u0627\u0644\u0629 \u0645\u0631\u0627\u062c\u0639\u0629',
        err_not_rejected: '\u0627\u0644\u0625\u062f\u062e\u0627\u0644 \u063a\u064a\u0631 \u0645\u0631\u0641\u0648\u0636',
        err_cannot_modify: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0646\u062a\u0627\u0626\u062c',
        err_lab_number_retry: '\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0631\u0642\u0645 \u0641\u0631\u064a\u062f\u060c \u062d\u0627\u0648\u0644 \u0645\u062c\u062f\u062f\u0627',
        err_invalid_blood_group: '\u0641\u0635\u064a\u0644\u0629 \u062f\u0645 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629',
        err_unit_not_found: '\u0627\u0644\u0648\u062d\u062f\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629',
        err_invalid_status: '\u062d\u0627\u0644\u0629 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629',
        err_unit_unavailable: '\u0627\u0644\u0648\u062d\u062f\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629',
        err_unit_expired: '\u0627\u0644\u0648\u062d\u062f\u0629 \u0645\u0646\u062a\u0647\u064a\u0629 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629',
        err_incompatible_xm: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u0635\u0631\u0641 \u0648\u062d\u062f\u0629 \u063a\u064a\u0631 \u0645\u062a\u0648\u0627\u0641\u0642\u0629',
        err_transfusion_not_found: '\u0646\u0642\u0644 \u0627\u0644\u062f\u0645 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f',
        err_equipment_not_found: '\u0627\u0644\u0645\u0639\u062f\u0627\u062a \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629',
        err_no_fields: '\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0642\u0648\u0644 \u0644\u0644\u062a\u062d\u062f\u064a\u062b',
        err_invalid_maint_type: '\u0646\u0648\u0639 \u0635\u064a\u0627\u0646\u0629 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_invalid_condition: '\u062d\u0627\u0644\u0629 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629',
        err_patient_not_found: '\u0627\u0644\u0645\u0631\u064a\u0636 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f',
        err_active_tests_list: '\u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0642\u0627\u0626\u0645\u0629',
        err_no_site_config: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0645\u0648\u0642\u0639',
        err_field_empty: '\u0627\u0644\u062d\u0642\u0644 \u0644\u0627 \u064a\u0645\u0643\u0646 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0641\u0627\u0631\u063a\u0627',
        err_site_code_length: '\u0631\u0645\u0632 \u0627\u0644\u0645\u0648\u0642\u0639 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 3-5 \u0623\u062d\u0631\u0641',
        err_db_not_found: '\u0642\u0627\u0639\u062f\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629',
        err_invalid_filename: '\u0627\u0633\u0645 \u0645\u0644\u0641 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_backup_not_found: '\u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629',
        err_no_file: '\u0644\u0645 \u064a\u062a\u0645 \u0631\u0641\u0639 \u0645\u0644\u0641',
        err_no_file_selected: '\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0644\u0641',
        err_invalid_db: '\u0642\u0627\u0639\u062f\u0629 \u0628\u064a\u0627\u0646\u0627\u062a SQLite \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629',
        err_invalid_db_table: '\u0642\u0627\u0639\u062f\u0629 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629: \u062c\u062f\u0648\u0644 lab_register \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f',
        err_invalid_month: '\u0634\u0647\u0631 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_invalid_year: '\u0633\u0646\u0629 \u0623\u0648 \u0634\u0647\u0631 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d',
        err_four_eyes: '\u0644\u0627 \u064a\u0645\u0643\u0646 \u0644\u0646\u0641\u0633 \u0627\u0644\u0645\u0634\u063a\u0644 \u0625\u062f\u062e\u0627\u0644 \u0648\u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u0646\u062a\u0627\u0626\u062c'
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
        if (!translated) return;
        // If element has a .nav-label child, update only that
        const label = el.querySelector('.nav-label');
        if (label) {
            label.textContent = translated;
        } else {
            el.textContent = translated;
        }
    });
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated) el.placeholder = translated;
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
