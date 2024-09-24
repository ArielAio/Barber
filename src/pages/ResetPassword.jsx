import React, { useState, useEffect } from 'react';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useRouter } from 'next/router';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const router = useRouter();
  const { oobCode, apiKey } = router.query;

  useEffect(() => {
    const auth = getAuth();
    if (oobCode && apiKey) {
      auth.useDeviceLanguage();
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setIsCodeValid(true);
        })
        .catch(() => {
          setError('Código de redefinição de senha inválido ou expirado.');
        });
    }
  }, [oobCode, apiKey]);

  const handleResetPassword = async () => {
    const auth = getAuth();
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess('Senha redefinida com sucesso!');
    } catch (error) {
      setError('Erro ao redefinir a senha. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-gray-900">
        <h1 className="text-2xl font-bold mb-4">Redefinir Senha</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        {isCodeValid ? (
          <>
            <input
              type="password"
              placeholder="Nova Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-blue-500 text-white p-2 rounded"
            >
              Redefinir Senha
            </button>
          </>
        ) : (
          <p className="text-red-500">Código de redefinição de senha inválido ou expirado.</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
