import React, { useState, useEffect } from 'react';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useRouter } from 'next/router';
import SuccessModal from '../components/SuccessModal';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const router = useRouter();
  const { oobCode, apiKey } = router.query;

  useEffect(() => {
    const auth = getAuth();
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setIsCodeValid(true);
        })
        .catch((error) => {
          console.error('Error verifying reset code:', error);
          setError('Código de redefinição de senha inválido ou expirado.');
          setIsCodeValid(false);
        });
    }
  }, [oobCode]);

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('Por favor, insira uma nova senha.');
      return;
    }

    const auth = getAuth();
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess('Senha redefinida com sucesso!');
      setShowModal(true);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Erro ao redefinir a senha. Tente novamente.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm text-white">
        <h1 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h1>
        {error && <p className="text-red-400 mb-4 text-sm text-center">{error}</p>}
        {success && <p className="text-green-400 mb-4 text-sm text-center">{success}</p>}
        {isCodeValid ? (
          <>
            <input
              type="password"
              placeholder="Nova Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-600 rounded-md mb-4 bg-gray-700 text-white placeholder-gray-400"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md transition duration-300 ease-in-out"
            >
              Redefinir Senha
            </button>
          </>
        ) : (
          <p className="text-red-400 text-center">
            {error || 'Verificando código de redefinição de senha...'}
          </p>
        )}
      </div>
      <SuccessModal
        isOpen={showModal}
        onClose={handleCloseModal}
        message="Senha redefinida com sucesso!"
      />
    </div>
  );
};

export default ResetPassword;
