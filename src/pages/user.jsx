import DeleteUser from '../components/DeleteUserButton';

const UserProfile = ({ userId }) => {
    return (
        <div>
            <h1>Perfil do Usuário</h1>
            <DeleteUser userId={userId} />
        </div>
    );
};

export default UserProfile;
