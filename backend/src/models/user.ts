import {
  model, Model, Schema, Document,
} from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

interface IToken {
  token: string;
}

interface IUser {
  name?: string;
  email: string;
  password: string;
  tokens: IToken[];
}

interface IUserDoc extends Document, IUser {}

interface IUserModel extends Model<IUserDoc> {
  findUserByCredentials(email: string, password: string): Promise<IUserDoc>;
}

const tokenSchema = new Schema<IToken>({
  token: { type: String, required: true },
});

const userSchema = new Schema<IUserDoc, IUserModel>({
  name: {
    type: String,
    minlength: [2, 'Минимальная длина поля "name" - 2'],
    maxlength: [30, 'Максимальная длина поля "name" - 30'],
    default: 'Ё-мое',
  },
  email: {
    type: String,
    required: [true, 'Поле "email" должно быть заполнено'],
    unique: true,
    validate: {
      validator: (val: string) => validator.isEmail(val),
      message: 'Некорректный email',
    },
  },
  password: {
    type: String,
    required: [true, 'Поле "password" должно быть заполнено'],
    minlength: [6, 'Минимальная длина поля "password" - 6'],
    select: false,
  },
  tokens: {
    type: [tokenSchema],
    select: false,
    default: [],
  },
});

userSchema.static(
  'findUserByCredentials',
  function findUserByCredentials(
    this: IUserModel,
    email: string,
    password: string,
  ) {
    return this.findOne({ email })
      .select('+password')
      .then((user) => {
        if (!user) {
          return Promise.reject(new Error('Неправильные почта или пароль'));
        }

        return bcrypt.compare(password, user.password).then((matched) => {
          if (!matched) {
            return Promise.reject(new Error('Неправильные почта или пароль'));
          }

          return user;
        });
      });
  },
);

export default model<IUserDoc, IUserModel>('user', userSchema);
