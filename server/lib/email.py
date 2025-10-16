def send_magic_link_email(email: str, token: str):
    magic_link = f"http://localhost:3000/magic-login?token={token}"
    print(f"Send email to {email} with link: {magic_link}")
    # Ici tu enverrais l'email via SMTP ou service type SendGrid/Mailgun
