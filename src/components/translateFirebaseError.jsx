// Função para traduzir os códigos de erro do Firebase
const translateFirebaseError = (errorCode) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'O formato do e-mail é inválido.';
        case 'auth/user-disabled':
            return 'Esta conta foi desativada. Entre em contato com o suporte.';
        case 'auth/user-not-found':
            return 'Nenhuma conta foi encontrada com este e-mail.';
        case 'auth/wrong-password':
            return 'A senha está incorreta. Tente novamente.';
        case 'auth/email-already-in-use':
            return 'Este e-mail já está em uso. Tente fazer login ou usar outro e-mail.';
        case 'auth/operation-not-allowed':
            return 'Este método de login está desativado. Entre em contato com o suporte.';
        case 'auth/weak-password':
            return 'A senha é muito fraca. Use uma senha com pelo menos 6 caracteres.';
        case 'auth/invalid-credential':
            return 'Credenciais inválidas. Verifique seus dados e tente novamente.';
        case 'auth/credential-already-in-use':
            return 'As credenciais já estão associadas a outra conta.';
        case 'auth/account-exists-with-different-credential':
            return 'Uma conta com este e-mail já existe, mas foi criada com um método de login diferente.';
        case 'auth/invalid-verification-code':
            return 'O código de verificação está incorreto ou expirou.';
        case 'auth/invalid-verification-id':
            return 'O ID de verificação é inválido. Tente novamente.';
        case 'auth/too-many-requests':
            return 'Houve muitas tentativas de login. Por favor, tente novamente mais tarde.';
        case 'auth/popup-closed-by-user':
            return 'O login com o Google foi cancelado. Tente novamente.';
        case 'auth/cancelled-popup-request':
            return 'Outra janela de login foi aberta. Feche-a e tente novamente.';
        case 'auth/network-request-failed':
            return 'Erro de rede. Verifique sua conexão e tente novamente.';
        case 'auth/requires-recent-login':
            return 'Por motivos de segurança, faça login novamente para continuar.';
        case 'auth/missing-email':
            return 'O campo de e-mail não pode estar vazio.';
        case 'auth/internal-error':
            return 'Ocorreu um erro interno. Tente novamente mais tarde.';
        case 'auth/invalid-phone-number':
            return 'O número de telefone informado é inválido. Verifique e tente novamente.';
        case 'auth/missing-phone-number':
            return 'É necessário fornecer um número de telefone para continuar.';
        case 'auth/quota-exceeded':
            return 'A cota de solicitações foi excedida. Tente novamente mais tarde.';
        case 'auth/app-not-authorized':
            return 'Este aplicativo não está autorizado a usar a autenticação Firebase.';
        case 'auth/unauthorized-domain':
            return 'O domínio deste aplicativo não está autorizado. Entre em contato com o suporte.';
        case 'auth/invalid-api-key':
            return 'Chave de API inválida. Verifique a configuração do Firebase.';
        case 'auth/expired-action-code':
            return 'O código de ação expirou. Solicite um novo.';
        default:
            return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
    }
};

export default translateFirebaseError;