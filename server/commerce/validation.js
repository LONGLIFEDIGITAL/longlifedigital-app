const labels = {
  first_name: 'First name',
  last_name: 'Last name',
  company: 'Company',
  address_1: 'Address',
  address_2: 'Apartment / suite',
  city: 'City',
  state: 'State / region',
  postcode: 'Postal code',
  country: 'Country',
  email: 'Email address',
  phone: 'Phone',
};

// WordPress schema errors nest params/details under billing_address; Woo's own
// validation can instead identify the field in a code or a message path.
export function billingErrors(error) {
  const fields = {};
  const visit = (value, field, depth = 0) => {
    if (depth > 8 || value == null) return;
    if (typeof value === 'string') {
      const path = /billing_address(?:\[|\.)([a-z_]+)\]?/.exec(value);
      const code = /(?:billing_|invalid_)(email|phone|postcode|country|state)\b/.exec(value);
      const key = field || path?.[1] || code?.[1];
      if (Object.hasOwn(labels, key))
        fields[key] = `Please check your ${labels[key].toLowerCase()}.`;
    } else if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        const path = /billing_address\[([a-z_]+)\]/.exec(key);
        visit(child, Object.hasOwn(labels, key) ? key : path?.[1] || field, depth + 1);
      }
    }
  };
  visit({ code: error.code, message: error.message, data: error.data });
  return fields;
}

export function billingErrorMessage(fields) {
  return `Please check these billing fields: ${Object.keys(fields)
    .map((key) => labels[key])
    .join(', ')}.`;
}
