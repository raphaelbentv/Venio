import React from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

const FormField: React.FC<FormFieldProps> = ({ label, error, required, children }) => {
  return (
    <div className={`form-field${error ? ' form-field--error' : ''}`}>
      <label className="form-field__label">
        {label}
        {required && ' *'}
      </label>
      {children}
      {error && <p className="form-field__error">{error}</p>}
    </div>
  )
}

export default FormField
