const db = require('../config/conexion');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const saltRounds = 10;

// Función para generar contraseña aleatoria
const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};

// Configuración de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'practicaenvio@gmail.com',
        pass: 'ndju lpfo wyiz hwvw'
    }
});

// Función para enviar correo
const sendWelcomeEmail = async (userData, password) => {
    const mailOptions = {
        from: 'practicaenvio@gmail.com', // Usar el mismo correo configurado en el transporter
        to: userData.correo,
        subject: 'Bienvenido a Solo Electricos - Tus credenciales de acceso',
        html: `
            <h1>Bienvenido a Solo Electricos</h1>
            <p>Hola ${userData.nombres},</p>
            <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales de acceso:</p>
            <p><strong>Correo:</strong> ${userData.correo}</p>
            <p><strong>Contraseña:</strong> ${password}</p>
            <p>Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
            <p>Saludos cordiales,<br>Equipo de Solo Electricos</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

// Función para insertar usuario en la base de datos
const insertUserDB = (userData, hashedPassword) => {
    return new Promise((resolve, reject) => {
        db.query(
            "INSERT INTO usuario(Nombres, Apellidos, Correo, Contrasena, Telefono, Direccion, Genero, Rol) VALUES (?,?,?,?,?,?,?,?)",
            [userData.nombres, userData.apellidos, userData.correo, hashedPassword, 
             userData.telefono, userData.direccion, userData.genero, userData.rol],
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            }
        );
    });
};

const createUser = async (req, res) => {
    try {
        const userData = {
            nombres: req.body.Nombres,
            apellidos: req.body.Apellidos,
            correo: req.body.Correo,
            telefono: req.body.Telefono,
            direccion: req.body.Direccion,
            genero: req.body.Genero,
            rol: req.body.Rol
        };

        // Generar contraseña aleatoria
        const generatedPassword = generatePassword();

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);

        // Insertar usuario en la base de datos
        await insertUserDB(userData, hashedPassword);

        // Enviar correo con las credenciales
        await sendWelcomeEmail(userData, generatedPassword);

        res.status(200).json({
            success: true,
            message: "Usuario registrado exitosamente y correo enviado"
        });

    } catch (error) {
        console.error('Error en createUser:', error);
        
        // Determinar el tipo de error para dar una respuesta más específica
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: "El correo electrónico ya está registrado"
            });
        }

        res.status(500).json({
            success: false,
            message: "Error en el registro de usuario",
            error: error.message
        });
    }
};

const generateRecoveryCode = () => {
    return Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos
};


// Función para enviar correo con código de recuperación
const sendRecoveryEmail = async (userEmail, recoveryCode) => {
    const mailOptions = {
        from: 'practicaenvio@gmail.com',
        to: userEmail,
        subject: 'Recuperación de contraseña - Solo Eléctricos',
        html: `
            <h1>Recuperación de contraseña</h1>
            <p>Hola,</p>
            <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para continuar con el proceso:</p>
            <h2>${recoveryCode}</h2>
            <p>Si no solicitaste esto, ignora este mensaje.</p>
            <p>Saludos,<br>Equipo de Solo Eléctricos</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

const startPasswordRecovery = async (req, res) => {
    try {
        const Correo = req.body.Correo;

        console.log('Correo recibido:', Correo);

        // Verificar si el correo existe en la base de datos
        const [user] = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM usuario WHERE Correo = ?", [Correo], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "El correo no está registrado"
            });
        }

        // Generar y guardar código de recuperación
        const recoveryCode = generateRecoveryCode();
        await new Promise((resolve, reject) => {
            db.query("UPDATE usuario SET Codigo = ? WHERE Correo = ?", [recoveryCode, Correo], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        // Enviar correo con el código
        await sendRecoveryEmail(Correo, recoveryCode);

        res.status(200).json({
            success: true,
            message: "Código de recuperación enviado"
        });
    } catch (error) {
        console.error('Error en startPasswordRecovery:', error);
        res.status(500).json({
            success: false,
            message: "Error al iniciar la recuperación de contraseña",
            error: error.message
        });
    }
};

// Validar código y correo
const validateCode = async (req, res) => {
    try {
        const { Correo, Codigo } = req.body;
        console.log(Correo, Codigo);
        

        console.log(`Validando código para correo: ${Correo}`);

        // Validar código en la base de datos
        const [user] = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM usuario WHERE Correo = ? AND Codigo = ?", [Correo, Codigo], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Código inválido o expirado"
            });
        }

        // Retornar éxito y permitir cambiar contraseña
        res.status(200).json({
            success: true,
            message: "Código válido"
        });
    } catch (error) {
        console.error('Error en validateCode:', error);
        res.status(500).json({
            success: false,
            message: "Error al validar el código",
            error: error.message
        });
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const { Correo, NuevaContrasena } = req.body;

        console.log(`Actualizando contraseña para correo: ${Correo}`);

        // Encriptar nueva contraseña
        const hashedPassword = await bcrypt.hash(NuevaContrasena, saltRounds);

        // Actualizar contraseña y limpiar código
        await new Promise((resolve, reject) => {
            db.query("UPDATE usuario SET Contrasena = ?, Codigo = NULL WHERE Correo = ?", [hashedPassword, Correo], (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        res.status(200).json({
            success: true,
            message: "Contraseña actualizada correctamente"
        });
    } catch (error) {
        console.error('Error en changePassword:', error);
        res.status(500).json({
            success: false,
            message: "Error al cambiar la contraseña",
            error: error.message
        });
    }
};



const getUser = (req, res) => {
    // Obtenemos el ID desde los parámetros de la URL
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'ID de usuario no proporcionado'
        });
    }

    // Seleccionamos todos los campos excepto la contraseña
    const query = `
        SELECT * FROM usuario 
        WHERE Estado = 'Activo' 
        AND ID = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al consultar usuario:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los datos del usuario',
                error: err.message
            });
        }

        // Verificamos si se encontró el usuario
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Enviamos solo el primer resultado ya que buscamos por ID único
        res.status(200).json({
            success: true,
            data: results[0]  // Aquí devuelves los datos del usuario encontrado
        });
    });
};


const getUsers = (req, res) => {

    db.query("SELECT*FROM usuario WHERE Estado = 'Activo'", (err, results) => {

        if (err) {

            console.log(err);

        } else {

            res.send(results);
            console.log(results);

        }
    });
};

const getUsersI = (req, res) => {

    db.query("SELECT*FROM usuario WHERE Estado = 'Inactivo'", (err, results) => {

        if (err) {

            console.log(err);

        } else {

            res.send(results);
            console.log(results);

        }
    });
};

const updatePassword = async (req, res) => {
    console.log("Datos recibidos:", req.body);

    const id = req.body.ID;
    const contrasena = req.body.Contrasena;

    if (!id || !contrasena) {
        // Verifica que ambos datos estén presentes
        return res.status(400).send("Faltan datos: ID o Contrasena");
    }

    try {
        // Generar el hash de la contraseña con bcrypt
        const saltRounds = 10; // Define el número de rondas para bcrypt (puedes ajustarlo)
        const contrasenaHash = await bcrypt.hash(contrasena, saltRounds);

        const query = `UPDATE usuario SET Contrasena = ?, Usoc = 'Usada' WHERE ID = ?`;

        // Ejecutar la consulta con la contraseña cifrada
        db.query(query, [contrasenaHash, id], (err, results) => {
            if (err) {
                console.error("Error en la actualización:", err);
                return res.status(500).send("Error al actualizar el usuario");
            }

            if (results.affectedRows === 0) {
                return res.status(404).send("Usuario no encontrado");
            }

            res.send("Usuario actualizado con éxito");
            console.log("Resultado de la actualización:", results);
        });
    } catch (error) {
        console.error("Error al cifrar la contraseña:", error);
        res.status(500).send("Error interno al actualizar la contraseña");
    }
};

const validationUser = async (req, res) => {
    const correo = req.body.Correo;
    const contrasena = req.body.Contrasena;

    console.log('Intento de inicio de sesión para:', correo);

    try {
        const query = "SELECT * FROM usuario WHERE Correo = ? AND Estado = 'Activo'";
        db.query(query, [correo], async (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al acceder a la base de datos.'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado o inactivo.'
                });
            }

            const usuario = results[0];

            try {
                const contrasenasCoinciden = await bcrypt.compare(contrasena, usuario.Contrasena);

                if (contrasenasCoinciden) {
                    const usuarioSinContrasena = { ...usuario };
                    delete usuarioSinContrasena.Contrasena;

                    return res.status(200).json({
                        success: true,
                        message: 'Inicio de sesión exitoso.',
                        usuario: usuarioSinContrasena
                    });
                } else {
                    return res.status(401).json({
                        success: false,
                        message: 'Contraseña incorrecta.'
                    });
                }
            } catch (bcryptError) {
                console.error('Error al comparar contraseñas:', bcryptError);
                return res.status(500).json({
                    success: false,
                    message: 'Error al verificar las credenciales.'
                });
            }
        });
    } catch (error) {
        console.error('Error en validationUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
};

const updateUser = (req, res) => {
    const id = req.body.ID;
    const nombres = req.body.Nombres;
    const apellidos = req.body.Apellidos;
    const correo = req.body.Correo;
    const contrasena = req.body.Contrasena; // La nueva contraseña del usuario
    const telefono = req.body.Telefono;
    const direccion = req.body.Direccion;
    const genero = req.body.Genero;
    const rol = req.body.Rol;
    const estado = req.body.Estado;
    const currentPassword = req.body.CurrentPassword; // Contraseña actual del usuario (solo si la cambia)

    // Verificamos si el usuario quiere cambiar la contraseña
    if (contrasena) {
        // Primero, obtenemos la contraseña actual almacenada en la base de datos
        const queryGetPassword = `SELECT Contrasena FROM usuario WHERE ID = ?`;
        db.query(queryGetPassword, [id], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error al obtener los datos del usuario');
            }

            if (results.length === 0) {
                return res.status(404).send('Usuario no encontrado');
            }

            // Comparamos la contraseña actual con la almacenada
            const storedPassword = results[0].Contrasena;

            const match = await bcrypt.compare(currentPassword, storedPassword); // Compara las contraseñas
            if (!match) {
                return res.status(400).send('La contraseña actual es incorrecta');
            }

            // Encriptamos la nueva contraseña si las contraseñas coinciden
            const hashedPassword = await bcrypt.hash(contrasena, 10);

            // Ahora actualizamos los datos del usuario, incluyendo la nueva contraseña encriptada
            const updateQuery = `
                UPDATE usuario 
                SET Nombres = ?, Apellidos = ?, Correo = ?, Contrasena = ?, Telefono = ?, Direccion = ?, Genero = ?, Rol = ?, Estado = ? 
                WHERE ID = ?`;

            db.query(updateQuery, [nombres, apellidos, correo, hashedPassword, telefono, direccion, genero, rol, estado, id], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Error al actualizar el usuario');
                }
                res.send('Usuario actualizado con éxito');
            });
        });
    } else {
        // Si no se va a cambiar la contraseña, simplemente actualizamos el resto de los campos sin encriptar la contraseña
        const updateQuery = `
            UPDATE usuario 
            SET Nombres = ?, Apellidos = ?, Correo = ?, Telefono = ?, Direccion = ?, Genero = ?, Rol = ?, Estado = ? 
            WHERE ID = ?`;

        db.query(updateQuery, [nombres, apellidos, correo, telefono, direccion, genero, rol, estado, id], (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error al actualizar el usuario');
            }
            res.send('Usuario actualizado con éxito');
        });
    }
};


const updateUsers = (req, res) => {
    const id = req.body.ID;
    const nombres = req.body.Nombres;
    const apellidos = req.body.Apellidos;
    const correo = req.body.Correo;
    const contrasena = req.body.Contrasena;
    const telefono = req.body.Telefono;
    const direccion = req.body.Direccion;
    const genero = req.body.Genero;
    const rol = req.body.Rol;
    const estado = req.body.Estado;

    const query = `
        UPDATE usuario 
        SET Nombres = ?, Apellidos = ?, Correo = ?, Contrasena = ?, Telefono = ?, Direccion = ?, Genero = ?, Rol = ?, Estado = ?
        WHERE ID = ?`;

    // Ejecutar la consulta SQL para actualizar el usuario
    db.query(query, [nombres, apellidos, correo, contrasena, telefono, direccion, genero, rol, estado, id], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error al actualizar el usuario');
        } else {
            res.send('Usuario actualizado con éxito');
        }
    });
};
const desactivateUser = (req, res) => {
    const userId = req.params.id;

    const query = `
        UPDATE usuario 
        SET Estado = 'Inactivo' 
        WHERE ID = ?`;

        db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al actualizar el estado del usuario');
        } else {
            res.send('Usuario marcado como inactivo');
        }
    });
};

const reactivate = (req, res) => {
    const { userIds } = req.body;

    if (!userIds || userIds.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron IDs de usuario' });
    }

    // Crear la consulta SQL para reactivar los usuarios
    const query = `
        UPDATE usuario 
        SET Estado = 'Activo'
        WHERE ID IN (?)`;  // Usamos IN (?) para pasar los IDs

    // Ejecutamos la consulta con los userIds
    db.query(query, [userIds], (err, results) => {
        if (err) {
            console.error('Error al intentar reactivar usuarios:', err);
            return res.status(500).json({ error: 'Error al reactivar los usuarios', details: err });
        }

        // Si la consulta se ejecutó con éxito, devolvemos un mensaje de éxito
        res.status(200).json({ message: 'Usuarios reactivados correctamente', affectedRows: results.affectedRows });
    });
};



module.exports = {

    createUser,
    updateUser,
    updateUsers,
    updatePassword,
    getUser,
    getUsers,
    getUsersI,
    validationUser,
    desactivateUser,
    validateCode,
    changePassword,
    startPasswordRecovery,
    reactivate
}