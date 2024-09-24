import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, applyActionCode } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import app from '../lib/firebase';
import { motion } from 'framer-motion';
import Link from 'next/link';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const router = useRouter();
  const { oobCode } = router.query;
  const auth = getAuth(app);
  const db = getFirestore(app); 

  useEffect(() => {
    const verifyEmail = async () => {
      if (oobCode) {
        try {
          await applyActionCode(auth, oobCode);
          
          // Update user's emailVerified status in Firestore
          const user = auth.currentUser;
          if (user) {
            await updateDoc(doc(db, 'users', user.uid), {
              emailVerified: true,
            });
          }
          
          setVerificationStatus('success');
        } catch (error) {
          console.error('Error verifying email:', error);
          setVerificationStatus('error');
        }
      }
    };

    verifyEmail();
  }, [oobCode, auth, db]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return <p className="text-blue-300">Verificando seu e-mail...</p>;
      case 'success':
        return (
          <>
            <p className="text-green-300 mb-4">Seu e-mail foi verificado com sucesso!</p>
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Clique aqui para fazer login
            </Link>
          </>
        );
      case 'error':
        return (
          <>
            <p className="text-red-300 mb-4">Ocorreu um erro ao verificar seu e-mail.</p>
            <p className="text-blue-300">Por favor, tente novamente ou entre em contato com o suporte.</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <h2 className="text-center text-3xl font-extrabold text-blue-300 mb-6">
            Verificação de E-mail
          </h2>
          <div className="text-center">
            {renderContent()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VerifyEmail;
