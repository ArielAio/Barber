import { getAuth, deleteUser } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import app from '../lib/firebase'; // Certifique-se de que seu Firebase está configurado aqui

const DeleteUserButton = () => {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleDeleteUser = async () => {
    const user = auth.currentUser;

    if (user) {
      const uid = user.uid;

      try {
        // Primeiro, deletar o documento do usuário no Firestore
        await deleteDoc(doc(db, 'users', uid));
        console.log('Usuário deletado da Firestore');

        // Depois, deletar o usuário do Firebase Authentication
        await deleteUser(user);
        console.log('Usuário deletado do Firebase Authentication');

        // Redirecionar o usuário para a página de login após exclusão
        router.push('/login');
      } catch (error) {
        console.error('Erro ao deletar o usuário:', error);
      }
    } else {
      console.error('Nenhum usuário logado.');
    }
  };

  return (
    <button
      onClick={handleDeleteUser}
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Excluir Conta
    </button>
  );
};

export default DeleteUserButton;
