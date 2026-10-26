import * as yup from 'yup';

export const buildValidationSchema = (dictionary: any) => yup.object({
  name: yup
    .string()
    .trim()
    .required(dictionary.forms.signup.errors.nameRequired)
    .max(191, dictionary.forms.signup.errors.nameTooLong),

  email: yup
    .string()
    .trim()
    .email(dictionary.forms.signup.errors.emailInvalid)
    .required(dictionary.forms.signup.errors.emailRequired),

  phone: yup
    .string()
    .trim()
    .required(dictionary.forms.signup.errors.phoneRequired)
    .matches(
      /^\+?[0-9]{10,15}$/,
      dictionary.forms.signup.errors.phoneFormat
    ),

  password: yup
    .string()
    .required(dictionary.forms.signup.errors.passwordRequired)
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/,
      dictionary.forms.signup.errors.passwordComplexity
    ),

  password_confirmation: yup
    .string()
    .required(dictionary.forms.signup.errors.confirmRequired)
    .oneOf([yup.ref('password')], dictionary.forms.signup.errors.mismatch),
});
