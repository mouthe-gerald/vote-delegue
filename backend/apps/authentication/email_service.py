from django.core.mail import send_mail
from django.conf import settings


def envoyer_otp_email(email, prenom, code_otp):
    sujet = "🔐 Code de vérification — Vote Délégué"
    message = f"""
Bonjour {prenom},

Votre code de vérification pour l'inscription sur la plateforme de vote est :

    ╔══════════════╗
    ║   {code_otp}     ║
    ╚══════════════╝

Ce code est valable pendant 3 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

Cordialement,
L'équipe Vote Délégué
Licence Génie Informatique
    """

    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Vote Délégué</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">
                Licence Génie Informatique
            </p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 10px;">Bonjour {prenom} 👋</h2>
            <p style="color: #666; font-size: 16px;">
                Voici votre code de vérification pour confirmer votre inscription :
            </p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 12px; padding: 25px; text-align: center;
                        margin: 30px 0;">
                <span style="font-size: 42px; font-weight: bold; color: white;
                             letter-spacing: 12px;">{code_otp}</span>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
                ⏱️ Ce code expire dans <strong>3 minutes</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="color: #bbb; font-size: 12px; text-align: center;">
                Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
        </div>
    </div>
    """

    try:
        send_mail(
            subject=sujet,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Erreur envoi email : {str(e)}")
        return False