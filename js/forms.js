const FormValidator = {
  validate(formElement) {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    let isValid = true;
    const errors = [];
    
    inputs.forEach(input => {
      // Skip disabled fields
      if (input.disabled) return;
      
      const value = input.value.trim();
      const isRequired = input.hasAttribute('data-required') || input.required;
      const type = input.getAttribute('data-type') || input.type;
      
      let fieldError = null;
      
      if (isRequired && !value && type !== 'checkbox' && type !== 'radio') {
        fieldError = 'This field is required';
      } else if (isRequired && (type === 'checkbox' || type === 'radio') && !input.checked) {
         fieldError = 'This field is required';
      } else if (value) {
        if (type === 'email' && !this.isValidEmail(value)) {
          fieldError = 'Please enter a valid email address';
        } else if (type === 'phone' && !this.isValidPhone(value)) {
          fieldError = 'Please enter a valid phone number';
        } else if (input.hasAttribute('data-min-length') && value.length < parseInt(input.getAttribute('data-min-length'))) {
          fieldError = `Minimum length is ${input.getAttribute('data-min-length')} characters`;
        } else if (input.hasAttribute('data-pattern') && !new RegExp(input.getAttribute('data-pattern')).test(value)) {
          fieldError = input.getAttribute('data-error-msg') || 'Invalid format';
        }
      }
      
      if (fieldError) {
        isValid = false;
        errors.push({ element: input, message: fieldError });
      }
    });
    
    return { isValid, errors };
  },
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]+$/.test(phone);
  },
  
  showErrors(formElement, errors) {
    this.clearErrors(formElement);
    
    errors.forEach(error => {
      error.element.classList.add('error');
      
      const errorMsg = document.createElement('span');
      errorMsg.className = 'form-error';
      errorMsg.textContent = error.message;
      
      const formGroup = error.element.closest('.form-group') || error.element.parentNode;
      formGroup.appendChild(errorMsg);
      
      // Real-time clear on input
      const clearOnInput = () => {
        error.element.classList.remove('error');
        if (errorMsg.parentNode) errorMsg.parentNode.removeChild(errorMsg);
        error.element.removeEventListener('input', clearOnInput);
      };
      
      error.element.addEventListener('input', clearOnInput);
    });
  },
  
  clearErrors(formElement) {
    const errorMsgs = formElement.querySelectorAll('.form-error');
    errorMsgs.forEach(msg => msg.parentNode.removeChild(msg));
    
    const errorInputs = formElement.querySelectorAll('.error');
    errorInputs.forEach(input => input.classList.remove('error'));
  },
  
  resetForm(formElement) {
    formElement.reset();
    this.clearErrors(formElement);
  },
  
  getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }
};
