// models/Agendamento.ts
import mongoose from 'mongoose';

const agendamentoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    dataAgendamento: { type: Date, required: true },
    horaAgendamento: { type: String, required: true },
});

export const Agendamento = mongoose.model('Agendamento', agendamentoSchema);
