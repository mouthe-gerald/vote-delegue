from django.core.mail import send_mail
from django.conf import settings


def envoyer_otp_email(email, prenom, code_otp):
    sujet = "Code de vérification — VotingApp"

    message = f"""
Bonjour {prenom},

Votre code de vérification pour VotingApp est : {code_otp}

Ce code est valable pendant 3 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

Cordialement,
L'équipe VotingApp
IUT Fotso Victor de Bandjoun
    """

    html_message = f"""
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0B1C3D; padding: 0;">

        <div style="background-color: #0B1C3D; padding: 32px 30px 24px 30px; text-align: center; border-bottom: 3px solid #F0A500;">
            <table align="center" style="margin: 0 auto;">
                <tr>
                    <td style="background-color: #F0A500; width: 36px; height: 36px; border-radius: 8px; text-align: center; vertical-align: middle;">
                        <span style="font-size: 18px; font-weight: bold; color: #0B1C3D;">V</span>
                    </td>
                    <td style="padding-left: 10px;">
                        <span style="color: #FFFFFF; font-size: 20px; font-weight: bold;">VotingApp</span>
                    </td>
                </tr>
            </table>
        </div>

        <div style="background-color: #FFFFFF; padding: 40px 36px;">
            <h2 style="color: #0B1C3D; margin: 0 0 8px 0; font-size: 22px;">Bonjour {prenom},</h2>
            <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                Voici votre code de vérification pour confirmer votre inscription sur VotingApp, la plateforme de vote électronique de l'IUT Fotso Victor de Bandjoun.
            </p>

            <div style="background-color: #0B1C3D; border-radius: 12px; padding: 28px; text-align: center; margin: 0 0 28px 0;">
                <span style="font-size: 40px; font-weight: bold; color: #F0A500; letter-spacing: 10px;">{code_otp}</span>
            </div>

            <p style="color: #999999; font-size: 13px; text-align: center; margin: 0 0 24px 0;">
                Ce code expire dans <strong style="color: #555555;">3 minutes</strong>
            </p>

            <hr style="border: none; border-top: 1px solid #EEEEEE; margin: 24px 0;">

            <p style="color: #AAAAAA; font-size: 12px; text-align: center; line-height: 1.5; margin: 0;">
                Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.<br>
                Personne d'autre que vous n'a accès à ce code.
            </p>
        </div>

        <div style="background-color: #0B1C3D; padding: 20px 30px; text-align: center;">
            <p style="color: #8899AA; font-size: 12px; margin: 0;">
                VotingApp — Plateforme de Vote en Ligne
            </p>
            <p style="color: #667788; font-size: 11px; margin: 4px 0 0 0;">
                IUT Fotso Victor de Bandjoun — Université de Dschang
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
