import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Forms
      // Common Fields
      Name: 'Name',
      'Name Surname': 'Name Surname',
      Email: 'Email',
      'Professor Email': "Professor's Email",
      Password: 'Password',
      '******': '******',
      'user@edu.tecnocampus.cat': 'user@edu.tecnocampus.cat',
      'professsor@tecnocampus.cat': 'professor@tecnocampus.cat',
      103111: '103111',
      'Subject ID': 'Subject ID',
      'User ID': 'User ID',

      // Common Information Messages
      'This is your full name.': 'This is your full name.',
      'This is your email address.': 'This is your email address.',
      'This is your password.': 'This is your password.',

      // Common Error Messages
      'Name must be at least 2 characters.':
        'Name must be at least 2 characters.',
      'Invalid email address.': 'Invalid email address.',
      'Invalid email address, must be student email like: user@edu.tecnocampus.cat':
        'Invalid email address, must be student email like: user@edu.tecnocampus.cat',
      'Password must be at least 6 characters.':
        'Password must be at least 6 characters.',
      'User ID must be at least 1 character.':
        'User ID must be at least 1 character.',
      'Subject ID must be at least 1 character.':
        'Subject ID must be at least 1 character.',

      // Add User to Subject Form
      'Add User to Subject': 'Add User to Subject',

      // Create User Form
      'Create User': 'Create User',

      // Create Proffesor Form
      'Create Proffesor': 'Create Proffesor',
      'This is the full name of the proffesor.':
        'This is the full name of the proffesor.',
      'This is the email of the professor.':
        'This is the email of the professor.',

      //Create Subject Form
      'Create Subject': 'Create Subject',
      'Programming Fundamentals': 'Programming Fundamentals',
      'Code ': 'Code',
      'This is the name of the subject.': 'This is the name of the subject.',
      'This is the code of the subject.': 'This is the code of the subject.',
      'This is the email of the main professor.':
        'This is the email of the main professor.',
      'Code must be at least 6 characters.':
        'Code must be at least 6 characters.',

      // Delete Subject Form
      'Delete Subject': 'Delete Subject',

      // Delete User Form
      'Delete User': 'Delete User',

      // List all Subjects by User Form
      'List all Subjects by User': 'List all Subjects by User',
      'List Subjects': 'List Subjects',

      // List all Users of a Subject Form
      'List all Users of a Subject': 'List all Users of a Subject',
      'List Subjects': 'List Subjects',

      // List Users Info Form
      'List Users Info': 'List Users Info',

      //Remove User from Subject Form
      'Remove User from Subject': 'Remove User from Subject',

      // Validate User Credentials Form
      'Validate User Credentials': 'Validate User Credentials',

      // Login and Register Forms
      'Log In': 'Log In',
      'Sign Up': 'Sign Up',
      Logout: 'Logout',
      'Confirm Password': 'Confirm Password',
      'Passwords do not match': 'Passwords do not match',
      'You have been logged in successfully':
        'You have been logged in successfully',
      'You have been registered and logged in successfully':
        'You have been registered and logged in successfully',
      "Don't have an account?": "Don't have an account?",
      'Your username': 'Your username',
      'Your email': 'Your email',
      'Your password': 'Your password',
      'Enter your email and password below to login to your account':
        'Enter your email and password below to login to your account',
      'Enter your name, email and password below to sign up for an account':
        'Enter your name, email and password below to sign up for an account',
      'A verification email has been sent to your email address. Please verify your account before logging in.':
        'A verification email has been sent to your email address. Please verify your account before logging in.',

      // Language Selector
      Language: 'Language',

      //Alert dialog
      Ok: 'Ok',
      'Registration successful': 'Registration successful',

      // Add more translations here
    },
  },
  es: {
    translation: {
      // Formularios
      // Campos Comunes
      Name: 'Nombre',
      'Name Surname': 'Nombre Apellido',
      Email: 'Correo Electrónico',
      'Professor Email': 'Correo Electrónico del Profesor',
      Password: 'Contraseña',
      '******': '******',
      'user@edu.tecnocampus.cat': 'usuario@edu.tecnocampus.cat',
      'professsor@tecnocampus.cat': 'profesor@tecnocampus.cat',
      103111: '103111',
      'Subject ID': 'ID de la Asignatura',
      'User ID': 'ID de Usuario',

      // Mensajes de Información Comunes
      'This is your full name.': 'Este es tu nombre completo.',
      'This is your email address.':
        'Esta es tu dirección de correo electrónico.',
      'This is your password.': 'Esta es tu contraseña.',

      // Mensajes de Error Comunes
      'Name must be at least 2 characters.':
        'El nombre debe tener al menos 2 caracteres.',
      'Invalid email address.': 'Dirección de correo electrónico no válida.',
      'Invalid email address, must be student email like: user@edu.tecnocampus.cat':
        'Dirección de correo electrónico no válida, debe ser un correo de estudiante como: usuario@edu.tecnoampus.cat',
      'Password must be at least 6 characters.':
        'La contraseña debe tener al menos 6 caracteres.',
      'User ID must be at least 1 character.':
        'El ID de usuario debe tener al menos 1 carácter.',
      'Subject ID must be at least 1 character.':
        'El ID de asignatura debe tener al menos 1 carácter.',

      // Formulario Añadir Usuario a Asignatura
      'Add User to Subject': 'Añadir Usuario a Asignatura',

      // Formulario Crear Usuario
      'Create User': 'Crear Usuario',

      // Formulario Crear Profesor
      'Create Proffesor': 'Crear Profesor',
      'This is the full name of the proffesor.':
        'Este es el nombre completo del profesor.',
      'This is the email of the professor.': 'Este es el correo del profesor.',

      //Formulario Crear Asignatura
      'Create Subject': 'Crear Asignatura',
      'Programming Fundamentals': 'Fundamentos de Programación',
      'Code ': 'Código',
      'This is the name of the subject.': 'Este es el nombre de la asignatura.',
      'This is the code of the subject.': 'Este es el código de la asignatura.',
      'This is the email of the main professor.':
        'Este es el correo del profesor principal.',
      'Code must be at least 6 characters.':
        'El código debe tener al menos 6 caracteres.',

      // Formulario Eliminar Asignatura
      'Delete Subject': 'Eliminar Asignatura',

      // Formulario Eliminar Usuario
      'Delete User': 'Eliminar Usuario',

      // Formulario Listar todas las asignaturas por usuario
      'List all Subjects by User': 'Listar todas las asignaturas por usuario',
      'List Subjects': 'Listar Asignaturas',

      // Formulario Listar todos los usuarios de una asignatura
      'List all Users of a Subject':
        'Listar todos los usuarios de una asignatura',
      'List Subjects': 'Listar Asignaturas',

      // Formulario Listar Información de Usuarios
      'List Users Info': 'Listar Información de Usuarios',

      // Formulario Eliminar Usuario de Asignatura
      'Remove User from Subject': 'Eliminar Usuario de Asignatura',

      // Formulario Validar Credenciales de Usuario
      'Validate User Credentials': 'Validar Credenciales de Usuario',

      // Login and Register Forms
      'Log In': 'Iniciar Sesión',
      'Sign Up': 'Registrarse',
      Logout: 'Cerrar Sesión',
      'Confirm Password': 'Confirmar Contraseña',
      'Passwords do not match': 'Las contraseñas no coinciden',
      'You have been logged in successfully': 'Has iniciado sesión con éxito',
      'You have been registered and logged in successfully':
        'Te has registrado e iniciado sesión con éxito',
      "Don't have an account?": '¿No tienes una cuenta?',
      'Your username': 'Tu nombre de usuario',
      'Your email': 'Tu correo electrónico',
      'Your password': 'Tu contraseña',
      'Enter your email and password below to login to your account':
        'Introduce tu correo electrónico y contraseña para iniciar sesión en tu cuenta',
      'Enter your name, email and password below to sign up for an account':
        'Introduce tu nombre, correo electrónico y contraseña para registrarte en una cuenta',
      'A verification email has been sent to your email address. Please verify your account before logging in.':
        'Se ha enviado un correo de verificación a tu dirección de correo electrónico. Por favor, verifica tu cuenta antes de iniciar sesión.',

      // Selector de Idioma
      Language: 'Idioma',

      //Dialogo de alerta
      Ok: 'De acuerdo',
      'Registration successful': 'Registro exitoso',

      // Add more translations here
    },
  },
  ca: {
    translation: {
      // Formularis
      // Registres comuns
      Name: 'Nom',
      'Name Surname': 'Nom Cognom',
      Email: 'Correu Electrònic',
      'Professor Email': 'Correu Electrònic del Professor',
      Password: 'Contrasenya',
      '******': '******',
      'user@edu.tecnocampus.cat': 'usuari@edu.tecnocampus.cat',
      'professsor@tecnocampus.cat': 'professor@tecnocampus.cat',
      103111: '103111',
      'Subject ID': "ID de l'Assignatura",
      'User ID': "ID d'Usuari",

      // Missatges d'informació comuns
      'This is your full name.': 'Aquest és el teu nom complet.',
      'This is your email address.':
        'Aquesta és la teva adreça de correu electrònic.',
      'This is your password.': 'Aquesta és la teva contrasenya.',

      // Missatges d'error comuns
      'Name must be at least 2 characters.':
        'El nom ha de tenir almenys 2 caràcters.',
      'Invalid email address.': 'Adreça de correu electrònic no vàlida.',
      'Invalid email address, must be student email like: user@edu.tecnocampus.cat':
        'Adreça de correu electrònic no vàlida, ha de ser un correu d’estudiant com: usuari@edu.tecnocampus.cat',
      'Password must be at least 6 characters.':
        'La contrasenya ha de tenir almenys 6 caràcters.',
      'User ID must be at least 1 character.':
        "L'ID d'usuari ha de tenir almenys 1 caràcter.",
      'Subject ID must be at least 1 character.':
        "L'ID de l'assignatura ha de tenir almenys 1 caràcter.",

      // Formulari Afegir Usuari a Assignatura
      'Add User to Subject': 'Afegir Usuari a Assignatura',

      // Formulari Crear Usuari
      'Create User': 'Crear Usuari',

      // Formulari Crear Professor
      'Create Proffesor': 'Crear Professor',
      'This is the full name of the proffesor.':
        'Aquest és el nom complet del professor.',
      'This is the email of the professor.':
        'Aquest és el correu del professor.',

      //Formulari Crear Assignatura
      'Create Subject': 'Crear Assignatura',
      'Programming Fundamentals': 'Fonaments de Programació',
      'Code ': 'Codi',
      'This is the name of the subject.': "Aquest és el nom de l'assignatura.",
      'This is the code of the subject.': "Aquest és el codi de l'assignatura.",
      'This is the email of the main professor.':
        'Aquest és el correu del professor principal.',
      'Code must be at least 6 characters.':
        'El codi ha de tenir almenys 6 caràcters.',

      // Formulari Eliminar Assignatura
      'Delete Subject': 'Eliminar Assignatura',

      // Formulari Eliminar Usuari
      'Delete User': 'Eliminar Usuari',

      // Formulari Llistar totes les assignatures per usuari
      'List all Subjects by User': 'Llistar totes les assignatures per usuari',
      'List Subjects': 'Llistar Assignatures',

      // Formulari Llistar tots els usuaris d'una assignatura
      'List all Users of a Subject':
        'Llistar tots els usuaris d’una assignatura',
      'List Subjects': 'Llistar Assignatures',

      // Formulari Llistar Informació d'Usuaris
      'List Users Info': 'Llistar Informació d’Usuaris',

      // Formulari Eliminar Usuari d'Assignatura
      'Remove User from Subject': 'Eliminar Usuari d’Assignatura',

      // Formulari Validar Credencials d'Usuari
      'Validate User Credentials': 'Validar Credencials d’Usuari',

      // Login and Register Forms
      'Log In': 'Iniciar Sessió',
      'Sign Up': 'Registrar-se',
      Logout: 'Tancar Sessió',
      'Confirm Password': 'Confirmar Contrasenya',
      'Passwords do not match': 'Les contrasenyes no coincideixen',
      'You have been logged in successfully': 'Has iniciat sessió amb èxit',
      'You have been registered and logged in successfully':
        'T’has registrat i iniciat sessió amb èxit',
      "Don't have an account?": 'No tens un compte?',
      'Your username': 'El teu nom d’usuari',
      'Your email': 'El teu correu electrònic',
      'Your password': 'La teva contrasenya',
      'Enter your email and password below to login to your account':
        'Introdueix el teu correu electrònic i contrasenya per iniciar sessió al teu compte',
      'Enter your name, email and password below to sign up for an account':
        'Introdueix el teu nom, correu electrònic i contrasenya per registrar-te a un compte',
      'A verification email has been sent to your email address. Please verify your account before logging in.':
        "S'ha enviat un correu de verificació a la teva adreça de correu electrònic. Si us plau, verifica el teu compte abans d'iniciar sessió.",

      // Selector d'idioma
      Language: 'Idioma',

      //Diàleg d'alerta
      Ok: 'D’acord',
      'Registration successful': 'Registre exitós',

      // Add more translations here
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // default language
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
