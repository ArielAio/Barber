// pages/api/agendamento.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDb } from '../../lib/mongodb';
import { Agendamento } from '../models/Agendamento';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await connectDb();

    if (req.method === 'POST') {
        const { nome, email, dataAgendamento, horaAgendamento } = req.body;

        try {
            const novoAgendamento = new Agendamento({
                nome,
                email,
                dataAgendamento,
                horaAgendamento,
            });

            await novoAgendamento.save();
            res.status(201).json({ message: 'Agendamento criado com sucesso!' });
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            res.status(500).json({ message: 'Erro ao criar agendamento', error });
        }
    } else {
        res.status(405).json({ message: 'Método não permitido' });
    }
}
