import { User } from './user.model';
import config from './../../config';
import jwt from 'jsonwebtoken';

const createUser = async (req, res) => {
    const { email, password } = req.body;
    const user = new User({ email, password });
    user.save(err => {
        if (err) {
            res.status(500).send({ message: "Error registering new user." }).end();
        } else {
            res.status(200).send({ message: 'User is registered' });
        }
    })
}

const signInUser = async (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email }, function(err, user) {
        if (err) {
            res.status(500).send({ error: 'Internal error, please try again.' });
        } else if (!user) {
            res.status(401).send({ error: 'Incorect email or password.' });
        } else {
            user.isCorrectPassword(password, function(err, same) {
                if (err) {
                    res.status(500).send({ error: 'Interna error, please try again.' });
                } else if (!same) {
                    res.status(401).send({ error: 'Incorrect email or password' });
                } else {
                    res = setCookie(res, email)
                    res.sendStatus(200);
                }
            });
        };
    });
}

const setCookie = (res, email) => {
    const payload = { email };
    const token = jwt.sign(payload, config.authSecret, {
        expiresIn: '7d'
    });
    res.cookie('token', token, { maxAge: 48 * 60 * 60 * 1000, httpOnly: true, });

    return res;
}

export const controllers = {
    createUser: createUser,
    signInUser: signInUser,
}