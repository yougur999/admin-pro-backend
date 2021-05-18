const { response } = require('express');
const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');
const { googleVerify } = require('../helpers/google-verify');


const login = async (req, res = response) => {

    // verificar email
    const { email, password } = req.body;


    try {

        const usuarioDB = await Usuario.findOne({ email });

        if (!usuarioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'Email no encontrado'
            });
        }
    
        // verificar contraseña 
        const validPassword = bcrypt.compareSync(password, usuarioDB.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Contraseña no válida'
            });
        }
    
        // Generar un token -> JWT 
        const token = await generarJWT(usuarioDB.id);


        res.json({
            ok: true,
            token
        })
         
    } catch(error) {
        console.log(error);
        res.status(500).json({
            ok: false, 
            msg: 'Hable con el administrador...'
        });
    }

}

const googleSignin = async (req, res = response) => {

    const googleToken = req.body.token;

    try {

        const {name, email, picture} = await googleVerify(googleToken);

        const usuarioDB = await Usuario.findOne({email});
        let usuario;
        if (!usuarioDB) {
            // si no existe el usuario 
            usuario = new Usuario({
                nombre: name,
                email,
                password: '@@@',
                img: picture,
                google: true
            });
        } else {
            // existe usuario 
            usuario = usuarioDB;
            usuario.google = true;
        }

        // Guardar en la base de datos 
        await usuario.save();

        // Generar el TOKEN - JWT 
        const token = await generarJWT(usuario.id);

        res.json({
            ok: true,
            token
        });

    } catch (error) {

        res.status(401).json({
            ok: false,
            msg: 'Token no es correcto...',
        });
    }


   
    
}

module.exports = {
    login,
    googleSignin
}