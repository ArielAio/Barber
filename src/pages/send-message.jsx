import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaPaperPlane } from 'react-icons/fa';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

const SendMessagePage = () => {
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sendStatus, setSendStatus] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchQrCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/send-message');
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();

        if (data.qrCode) {
          setQrCode(data.qrCode);
          setStatus('QR Code gerado');
          setIsLoading(false);
          setIsAuthenticated(false);
        } else if (data.status) {
          setStatus(data.status);
          if (data.isReady) {
            setQrCode(null);
            setIsLoading(false);
            setIsAuthenticated(true);
          } else {
            setTimeout(fetchQrCode, 2000);
          }
        } else {
          setError('Resposta inesperada do servidor: ' + JSON.stringify(data));
          setIsLoading(false);
        }
      } else {
        const text = await response.text();
        setError('Resposta não-JSON do servidor: ' + text.substring(0, 100) + '...');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Erro ao carregar o QR Code: ' + err.message);
      console.error('Erro detalhado:', err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendStatus(null);
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, message }),
      });
      const data = await response.json();
      setSendStatus(data.status);
    } catch (err) {
      setSendStatus('Erro ao enviar mensagem: ' + err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="flex flex-col min-h-screen w-full text-white pt-16">
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-blue-300">WhatsApp Web Sender</h1>
            <p className="text-lg sm:text-xl text-blue-200 mb-8">
              Envie mensagens pelo WhatsApp diretamente do seu navegador!
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl"
          >
            {error && (
              <motion.p variants={itemVariants} className="text-center bg-red-100 text-red-700 p-3 rounded mb-4">{error}</motion.p>
            )}
            
            {!isLoading && status && (
              <motion.p variants={itemVariants} className={`text-center p-3 rounded mb-4 ${isAuthenticated ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {status}
              </motion.p>
            )}
            
            {qrCode && !isAuthenticated && (
              <motion.div variants={itemVariants} className="flex flex-col items-center mb-6">
                <Image src={qrCode} alt="QR Code" width={256} height={256} className="mb-2" />
                <p className="text-sm text-gray-300">Escaneie este QR Code com seu WhatsApp para conectar.</p>
              </motion.div>
            )}
            
            {isAuthenticated && (
              <motion.p variants={itemVariants} className="text-center bg-green-100 text-green-700 p-3 rounded mb-4">
                Cliente conectado com sucesso! Você pode enviar mensagens agora.
              </motion.p>
            )}
            
            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-blue-300">Enviar Mensagem</h2>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Número de telefone (com código do país)"
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                required
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem"
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white h-32"
                required
              />
              <motion.button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPaperPlane className="mr-2" />
                Enviar Mensagem
              </motion.button>
            </motion.form>
            
            {sendStatus && (
              <motion.p variants={itemVariants} className="mt-4 text-center bg-blue-100 text-blue-700 p-3 rounded">{sendStatus}</motion.p>
            )}
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SendMessagePage;

