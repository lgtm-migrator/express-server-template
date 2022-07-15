import {
  EncryptedToken,
  DecryptedToken,
} from '../entities/Token';
import User, {UnpersistedUser} from '../entities/User';
import EncryptionHandler from '../interface_adapters/security/EncryptionHandler';
import UserPersistence from '../interface_adapters/persistence/UserPersistence';
import TokenGenerator from '../interface_adapters/security/TokenGenerator';

export default class UserUseCases {
  constructor(
    private persistence: UserPersistence,
    private tokenGenerator: TokenGenerator,
    private encryptionHandler: EncryptionHandler,
  ) {
    // does nothing
  }

  register(
    user: UnpersistedUser,
    onUserAlreadyExists: () => void,
    onSuccess: (token: EncryptedToken) => void,
    onError: () => void,
  ): void {
    this.persistence.exists(user.username).then((userAlreadyExists) => {
      if (userAlreadyExists) {
        onUserAlreadyExists();
      } else {
        encryptUser(user, this.encryptionHandler).then(
          (encryptedUser) => {
            this.persistence.createNew(encryptedUser).then(
              () => {
                const decryptedToken = new DecryptedToken(
                  encryptedUser.username,
                );
                onSuccess(this.tokenGenerator.encrypt(decryptedToken));
              },
              () => onError(),
            );
          },
          () => onError(),
        );
      }
    }, onError);
  }

  login(
    user: UnpersistedUser,
    onInvalidCredentials: () => void,
    onSuccess: (token: EncryptedToken) => void,
    onError: () => void,
  ): void {
    this.persistence.getByUsername(user.username).then((retreivedUser) => {
      if (retreivedUser === undefined) {
        onInvalidCredentials();
      } else {
        this.encryptionHandler
          .compare(user.password, retreivedUser.password)
          .then(
            (comparationResult) => {
              if (comparationResult) {
                const decryptedToken = new DecryptedToken(retreivedUser.id);
                onSuccess(this.tokenGenerator.encrypt(decryptedToken));
              } else {
                onInvalidCredentials();
              }
            },
            () => onError(),
          );
      }
    }, onError);
  }

  getById(
    id: string,
    onFound: (user: User) => void,
    onNotFound: () => void,
    onError: () => void,
  ): void {
    this.persistence.getById(id).then((retrievedUser) => {
      retrievedUser === undefined ? onNotFound() : onFound(retrievedUser);
    }, onError);
  }

  getByUsername(
    username: string,
    onFound: (user: User) => void,
    onNotFound: () => void,
    onError: () => void,
  ): void {
    this.persistence.getByUsername(username).then((retrievedUser) => {
      retrievedUser === undefined ? onNotFound() : onFound(retrievedUser);
    }, onError);
  }
}

async function encryptUser(
  user: UnpersistedUser,
  encryptionHandler: EncryptionHandler,
): Promise<UnpersistedUser> {
  return new UnpersistedUser(
    user.username,
    await encryptionHandler.encrypt(user.password),
  );
}
