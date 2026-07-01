from rest_framework             import status
from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts           import get_object_or_404

from apps.authentication.models import Administrateur, Etudiant, Role
from apps.elections.models      import Election, StatutElection
from apps.candidatures.models   import Candidature, StatutCandidature
from apps.votes.models          import Vote
from .models                    import Resultat, Rapport
from .serializers               import ResultatSerializer, RapportSerializer


class ResultatsElectionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, election_id):
        election = get_object_or_404(Election, pk=election_id)

        if election.statut not in [StatutElection.EN_COURS, StatutElection.CLOTUREE, StatutElection.RESULTATS_PUBLIES]:
            return Response(
                {'erreur': 'Résultats non disponibles.'},
                status=status.HTTP_403_FORBIDDEN
            )

        resultats = Resultat.objects.filter(
            election=election
        ).order_by('-nb_voix')

        serializer = ResultatSerializer(resultats, many=True, context={'request': request})
        return Response({
            'election':         str(election.id),
            'titre':            election.titre,
            'total_votants':    Vote.objects.filter(election=election).count(),
            'resultats':        serializer.data,
        }, status=status.HTTP_200_OK)


class CalculerResultatsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, election_id):
        election = get_object_or_404(Election, pk=election_id)

        if election.statut not in [
            StatutElection.EN_COURS,
            StatutElection.CLOTUREE,
            StatutElection.RESULTATS_PUBLIES
        ]:
            return Response(
                {'erreur': 'L\'élection doit être clôturée pour calculer les résultats.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Supprimer les anciens résultats
        Resultat.objects.filter(election=election).delete()

        # Récupérer tous les candidats validés
        candidatures = Candidature.objects.filter(
            election=election,
            statut=StatutCandidature.VALIDEE
        )

        total_votes = Vote.objects.filter(election=election).count()
        resultats   = []

        for candidature in candidatures:
            nb_voix = Vote.objects.filter(
                election=election,
                candidat=candidature
            ).count()

            pourcentage = round(
                (nb_voix / total_votes * 100) if total_votes > 0 else 0,
                2
            )

            resultat = Resultat.objects.create(
                election    = election,
                candidat    = candidature,
                nb_voix     = nb_voix,
                pourcentage = pourcentage,
                est_elu     = False,
            )
            resultats.append(resultat)

        # Déterminer l'élu (celui avec le plus de voix)
        if resultats:
            elu = max(resultats, key=lambda r: r.nb_voix)
            elu.est_elu = True
            elu.save()

        serializer = ResultatSerializer(
            Resultat.objects.filter(election=election).order_by('-nb_voix'),
            many=True, context={'request': request}
        )

        return Response({
            'message':       'Résultats calculés avec succès.',
            'total_votants': total_votes,
            'resultats':     serializer.data,
        }, status=status.HTTP_200_OK)


class GenererRapportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, election_id):
        if request.user.role != 'ADMINISTRATEUR':
            return Response({'erreur': 'Accès réservé aux administrateurs.'}, status=status.HTTP_403_FORBIDDEN)

        from weasyprint import HTML
        from django.http import HttpResponse
        from datetime import datetime

        election    = get_object_or_404(Election, pk=election_id)
        resultats   = Resultat.objects.filter(election=election).order_by('-nb_voix')
        nb_votants  = Vote.objects.filter(election=election).count()
        nb_inscrits = Etudiant.objects.count()
        taux        = round((nb_votants / nb_inscrits * 100) if nb_inscrits > 0 else 0, 2)
        elu         = resultats.filter(est_elu=True).first()

        rows = ""
        for i, r in enumerate(resultats):
            medaille   = "🥇" if i == 0 else ("🥈" if i == 1 else ("🥉" if i == 2 else ""))
            elu_style  = "background:#fffbeb;font-weight:bold;" if r.est_elu else ""
            programme  = r.candidat.programme[:200] + "..." if r.candidat.programme and len(r.candidat.programme) > 200 else (r.candidat.programme or "—")
            rows += f"""
            <tr style="{elu_style}">
                <td style="text-align:center;font-size:18px;">{medaille} {i+1}</td>
                <td><strong>{r.candidat_nom}</strong><br><small style="color:#666;">{programme}</small></td>
                <td style="text-align:center;font-weight:bold;font-size:16px;">{r.nb_voix}</td>
                <td style="text-align:center;">
                    <div style="background:#e5e7eb;border-radius:4px;height:10px;width:100%;">
                        <div style="background:#f59e0b;border-radius:4px;height:10px;width:{r.pourcentage}%;"></div>
                    </div>
                    <small>{r.pourcentage}%</small>
                </td>
                <td style="text-align:center;">{"🏆 Élu" if r.est_elu else "Candidat"}</td>
            </tr>"""

        elu_section = ""
        if elu:
            elu_section = f"""
            <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
                <div style="font-size:36px;">🏆</div>
                <h2 style="color:#92400e;margin:8px 0;">Délégué Élu</h2>
                <h1 style="color:#1e293b;margin:4px 0;">{elu.candidat_nom}</h1>
                <p style="color:#666;">{elu.nb_voix} votes — {elu.pourcentage}%</p>
            </div>"""

        html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
  th {{ background: #0f172a; color: white; padding: 12px; text-align: left; }}
  td {{ padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }}
  .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }}
  .info-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }}
  .info-label {{ color: #64748b; font-size: 12px; margin-bottom: 4px; }}
  .info-value {{ font-weight: bold; font-size: 18px; }}
  .signatures {{ display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 80px; }}
  .signature-box {{ text-align: center; }}
  .signature-line {{ border-top: 2px solid #1e293b; margin-top: 80px; padding-top: 8px; font-weight: bold; font-size: 14px; }}
  .footer {{ text-align: center; color: #94a3b8; font-size: 11px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; }}
</style>
</head>
<body>
  <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #f59e0b;padding-bottom:20px;">
    <h1 style="font-size:26px;color:#0f172a;margin:0;">RAPPORT DE L'ÉLECTION</h1>
    <h2 style="color:#f59e0b;margin:8px 0;">{election.titre}</h2>
    <p style="color:#64748b;margin:0;">Généré le {datetime.now().strftime("%d/%m/%Y à %H:%M")}</p>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="info-label">Année académique</div>
      <div class="info-value">{election.annee_academique}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Période</div>
      <div class="info-value" style="font-size:14px;">{election.date_debut.strftime("%d/%m/%Y")} → {election.date_fin.strftime("%d/%m/%Y")}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Total votants</div>
      <div class="info-value" style="color:#f59e0b;">{nb_votants}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Taux de participation</div>
      <div class="info-value" style="color:#10b981;">{taux}%</div>
    </div>
  </div>

  {elu_section}

  <h2 style="margin-top:30px;">Classement des candidats</h2>
  <table>
    <thead>
      <tr>
        <th style="width:60px;">Rang</th>
        <th>Candidat &amp; Programme</th>
        <th style="width:80px;text-align:center;">Votes</th>
        <th style="width:150px;text-align:center;">Pourcentage</th>
        <th style="width:100px;text-align:center;">Statut</th>
      </tr>
    </thead>
    <tbody>
      {rows if rows else '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:30px;">Aucun résultat disponible.</td></tr>'}
    </tbody>
  </table>

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">Le Directeur</div>
    </div>
    <div class="signature-box">
      <div class="signature-line">L'Administrateur</div>
    </div>
  </div>

  <div class="footer">VotingApp — Plateforme de Vote en Ligne © 2025-2026</div>
</body>
</html>"""

        pdf = HTML(string=html).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="rapport_election_{election_id}.pdf"'
        return response
        serializer = RapportSerializer(rapport)
        return Response({
            'message': 'Rapport généré avec succès.',
            'rapport': serializer.data,
        }, status=status.HTTP_201_CREATED)