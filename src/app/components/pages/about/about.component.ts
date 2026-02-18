import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  currentYear = new Date().getFullYear();
  imagesLoaded = false;
  currentSlides: { [key: number]: number } = {};

  companyInfo = {
    name: 'Froid Cheikh Anta Mbacké',
    foundedYear: 2015,
    description: 'Spécialiste en climatisation et réfrigération au Sénégal',
    mission: 'Fournir des solutions de climatisation et de réfrigération de qualité supérieure pour le confort de nos clients',
    vision: 'Être le leader de la climatisation au Sénégal en offrant des produits innovants et un service client exceptionnel',

    // Partenaires avec logos
    partners: [
      {
        name: 'Hopital Fann',
        logo: '/assets/images/partners/fann.jpeg',
        description: 'Contrat de prestation de service de maintenance et de reparation de toute les appareil froid'
      },
      {
        name: 'Air Senegal',
        logo: '/assets/images/partners/airSenegal.jpeg',
        description: "Installation de 13 climatisseur cassete et contrat d'entretient des materiel froid"
      },
      {
        name: 'petrosen',
        logo: '/assets/images/partners/petrosen.png',
        description: "Contrat de prestation de service de maintenance et de reparation de toute les appareil froid"
      },
      {
        name: 'hogip',
        logo: '/assets/images/partners/hogip.jpeg',
        description: 'Contrat de prestation de service de maintenance et de reparation de toute les appareil froid'
      },
      {
        name: 'Magic Land',
        logo: '/assets/images/partners/magic.jpeg',
        description: 'Contrat de maintenance et de reparation de toute les appareil froid et installation de mini Centrale dans les sale cinemas'
      },
      {
        name: 'Air Liquide',
        logo: '/assets/images/partners/airLiquide.png',
        description: 'installation de 3 chambres froides negatif'
      }
    ],

    // Services étendus avec descriptions détaillées
    services: [
      {
        title: 'Vente d\'Équipements',
        image: '/assets/images/services/vente.png',
        description: 'Large gamme de climatiseurs et équipements de réfrigération des meilleures marques',
        features: [
          'Climatiseurs split et multi-split',
          'Systèmes VRV/VRF et chambre froide',
          'Climatiseur Armoire et casette',
          'Équipements de réfrigération commerciale'
        ]
      },
      {
        title: 'Installation Professionnelle',
        image: '/assets/images/services/installation.jpg',
        description: 'Installation certifiée par des techniciens qualifiés respectant les normes internationales',
        features: [
          'Étude technique préalable',
          'Installation selon normes NF',
          'Test de performance',
          'Formation à l\'utilisation'
        ]
      },
      {
        title: 'Maintenance & Réparation',
        image: '/assets/images/services/maintenance.jpg',
        description: 'Service après-vente complet pour garantir la longévité de vos équipements',
        features: [
          'Contrats de maintenance préventive',
          'Intervention d\'urgence 24h/7j',
          'Diagnostic et réparation',
          'Nettoyage et désinfection'
        ]
      },
      {
        title: 'Encastrement de liaison frigorifique',
        image: '/assets/images/services/encastrement.jpg',
        description: 'Installation discrète et soignée des liaisons frigorifiques encastrées dans murs ou dalles',
        features: [
          'Passage des tuyauteries cuivre isolées',
          'Intégration dans les murs ou faux-plafonds',
          'Protection par gaines techniques',
          'Finition esthétique sans goulottes apparentes'
        ]
      }
      ,
      {
        title: 'Location d\'Équipements',
        image: '/assets/images/services/location.jpeg',
        description: 'Solutions temporaires pour vos besoins ponctuels ou saisonniers',
        features: [
          'Climatiseurs mobiles',
          'Solutions événementielles',
          'Location courte et longue durée',
          'Livraison et installation incluses'
        ]
      },
      {
        title: 'Installation de chambres froides',
        image: '/assets/images/services/chambre-froide.jpeg',
        description: 'Conception et installation de chambres froides positives, négatives et de morgues',
        features: [
          'Étude et dimensionnement adapté à vos besoins',
          'Installation chambres froides positives (0°C à +8°C)',
          'Installation chambres froides négatives (-18°C et plus)',
          'Mise en place de chambres froides mortuaires (morgues)',
        ]
      }
    ],

    // Équipe avec photos et informations détaillées
    team: [
      {
        name: 'Babacar dione',
        position: 'Fondateur & Directeur Général',
        experience: '20+ ans d\'expérience',
        photo: '/assets/images/team/cheikh-anta-mbacke.jpg',
        bio: 'Expert en climatisation avec une vision d\'innovation et d\'excellence. Pionnier du secteur au Sénégal.',
        skills: ['Leadership', 'Stratégie', 'Innovation', 'Développement commercial'],
        linkedin: '',
        email: ''
      },
      {
        name: 'El Hadji Ousmane',
        position: 'Responsable Technique',
        experience: '7 ans d\'expérience',
        photo: '/assets/images/team/amadou-diallo.jpg',
        bio: 'Technicien certifié spécialisé dans les systèmes de climatisation industrielle et commerciale.',
        skills: ['Installation', 'Maintenance', 'Diagnostic', 'Formation'],
        linkedin: '',
        email: ''
      },
      {
        name: 'Serigne Bassirou Gaye',
        position: 'Technicien Froid',
        experience: '8 ans d\'expérience',
        photo: '/assets/images/team/fatou-ndiaye.jpg',
        bio: 'Technicien Superieur en froid et climatisation avec une approche client personnalisée et efficace.',
        skills: ['Installation', 'Maintenance', 'Diagnostic', 'Formation'],
        linkedin: '',
        email: ''
      },
      {
        name: 'Modou Mamoune',
        position: 'Technicien Senior',
        experience: '10 ans d\'expérience',
        photo: '/assets/images/team/moussa-sarr.jpg',
        bio: 'Expert en maintenance préventive et corrective, spécialisé dans les systèmes VRV/VRF.',
        skills: ['Réparation', 'Maintenance', 'Électricité', 'Frigoriste'],
        email: ''
      },
      {
        name: 'Issa Dione',
        position: 'Technicien Senior',
        experience: '10 ans d\'expérience',
        photo: '/assets/images/team/issa.jpg',
        bio: 'Expert en maintenance préventive et corrective, spécialisé dans les chambre froide.',
        skills: ['Réparation', 'Maintenance', 'Électricité', 'Frigoriste'],
        email: ''
      },
      {
        name: 'Issa Tine',
        position: 'Technicien Froid',
        experience: '8 ans d\'expérience',
        photo: '/assets/images/team/tine.jpg',
        bio: 'Technicien Superieur en froid et climatisation avec une approche client personnalisée et efficace.',
        skills: ['Installation', 'Maintenance', 'Diagnostic', 'Formation'],
        linkedin: '',
        email: ''
      }
    ],

    // Réalisations avec galeries de photos
    achievements: [
      {
        title: 'Travaux Hospitaliers – CHNU de Fann',
        category: 'Maintenance & Installation',
        location: 'Dakar, Sénégal',
        images: [
          '/assets/images/achievements/fann.jpg',
          '/assets/images/achievements/fann2.jpg',
          '/assets/images/achievements/fann3.jpg',
        ],
        description: "Prestations de maintenance, d'installation et de réparation des équipements de froid et de climatisation au Centre hospitalier national universitaire de Fann.",
        duration: '12 mois',
        year: '2024',
        tags: ['Hôpital','chambre froide','Maintenance', 'Réparation', 'Installation', 'Froid', 'Climatisation'],
        client: 'Centre hospitalier national universitaire de Fann'
      },
      {
        title: 'Hôtel Océanie',
        category: 'Hôtellerie',
        location: 'Dakar, Sénégal',
        images: [
          '/assets/images/achievements/clim.png',
          '/assets/images/achievements/clim2.png',
          '/assets/images/achievements/clim3.jpg',
        ],
        description: "Installation et maintenance des climatiseurs split ainsi que la modernisation du système de climatisation avec l'ajout de 30 unités split.",
        surface: '5,000 m²',
        duration: '3 mois',
        year: '2022',
        tags: ['Installation', 'Maintenance', 'Hôtellerie', 'Split', 'Modernisation'],
        client: 'Hôtel Océanie'
      },
      {
        title: 'Usine Air Liquide',
        category: 'Industriel',
        location: 'Rufisque, Sénégal',
        images: [
          '/assets/images/achievements/chambre.jpg',
          '/assets/images/achievements/chambre11.jpg',
          '/assets/images/achievements/chambre12.jpg',
        ],
        description: "Installation de trois chambres froides négatives pour le stockage spécialisé ainsi qu'un système de refroidissement de l'eau adapté aux besoins industriels.",
        surface: '2,500 m²',
        duration: '6 semaines',
        year: '2023',
        tags: ['Industriel', 'Chambre froide', 'Refroidissement eau', 'Négatif'],
        client: 'Air Liquide'
      },
      {
        title: 'Résidence Les Almadies',
        category: 'Résidentiel',
        location: 'Almadies, Dakar',
        images: [
          '/assets/images/achievements/almadies.jpg',
          '/assets/images/achievements/maison2.jpg',
          '/assets/images/achievements/almadies3.jpg',
        ],
        description: "Réalisation de 60 encastrements de liaisons frigorifiques suivis de la fourniture et de l'installation de climatiseurs split inverter haute efficacité pour équiper l'ensemble des appartements.",
        surface: '3,200 m²',
        duration: '2 mois',
        year: '2024',
        tags: ['Résidentiel', 'Split Inverter', 'Installation', 'Efficacité énergétique'],
        client: 'Résidence Les Almadies'
      },
      {
        title: 'Air Sénégal',
        category: 'Transport Aérien',
        location: 'Dakar, Sénégal',
        images: [
          '/assets/images/achievements/air.jpg',
          '/assets/images/achievements/air1.jpg',
          '/assets/images/achievements/air4.jpg',
        ],
        description: "Prestations de maintenance, d'installation, de réparation et de fourniture d'équipements de froid et de climatisation pour les infrastructures de la compagnie.",
        surface: '4,000 m²',
        duration: '3 mois',
        year: '2023',
        tags: ['Aérien', 'Maintenance', 'Installation', 'Réparation', 'Climatisation'],
        client: 'Air Sénégal'
      },
      {
        title: 'Exploitation Agricole à Bambilor',
        category: 'Agricole',
        location: 'Bambilor, Sénégal',
        images: [
          '/assets/images/achievements/chambre.jpg',
          '/assets/images/achievements/chambre21.jpg',
          '/assets/images/achievements/chambre23.jpg',
        ],
        description: "Installation de deux chambres froides, l'une positive et l'autre négative, pour la conservation et le stockage des produits agricoles.",
        surface: '6,500 m²',
        duration: '5 mois',
        year: '2022',
        tags: ['Agricole', 'Chambre froide', 'Positif', 'Négatif', 'Conservation'],
        client: 'Exploitation agricole à Bambilor'
      }
    ]
  };

  constructor() { }

  ngOnInit(): void {
    // Initialiser les slides pour chaque réalisation
    this.companyInfo.achievements.forEach((_, index) => {
      this.currentSlides[index] = 0;
      this.startSlideShow(index);
    });

    // Précharger les images critiques
    this.preloadCriticalImages();
  }

  // Démarrer le carrousel automatique pour chaque réalisation
  startSlideShow(achievementIndex: number): void {
    setInterval(() => {
      const achievement = this.companyInfo.achievements[achievementIndex];
      if (achievement && achievement.images && achievement.images.length > 1) {
        this.currentSlides[achievementIndex] = (this.currentSlides[achievementIndex] + 1) % achievement.images.length;
      }
    }, 4000); // Change d'image toutes les 4 secondes
  }

  // Naviguer manuellement dans le carrousel
  goToSlide(achievementIndex: number, slideIndex: number): void {
    this.currentSlides[achievementIndex] = slideIndex;
  }

  // Navigation précédent/suivant
  previousSlide(achievementIndex: number): void {
    const achievement = this.companyInfo.achievements[achievementIndex];
    if (achievement && achievement.images && achievement.images.length > 1) {
      this.currentSlides[achievementIndex] =
        this.currentSlides[achievementIndex] === 0
          ? achievement.images.length - 1
          : this.currentSlides[achievementIndex] - 1;
    }
  }

  nextSlide(achievementIndex: number): void {
    const achievement = this.companyInfo.achievements[achievementIndex];
    if (achievement && achievement.images && achievement.images.length > 1) {
      this.currentSlides[achievementIndex] = (this.currentSlides[achievementIndex] + 1) % achievement.images.length;
    }
  }

  // Précharger les images critiques
  private preloadCriticalImages(): void {
    const criticalImages = [
      '/assets/images/hero-bg-climatisation.png',
      ...this.companyInfo.team.map(member => member.photo),
      ...this.companyInfo.partners.map(partner => partner.logo),
      // Précharger toutes les images des réalisations
      ...this.companyInfo.achievements.reduce((acc, achievement) => {
        return acc.concat(achievement.images);
      }, [] as string[])
    ];

    criticalImages.forEach(imagePath => {
      const img = new Image();
      img.onload = () => console.log(`Image préchargée: ${imagePath}`);
      img.onerror = () => console.warn(`Erreur de chargement: ${imagePath}`);
      img.src = imagePath;
    });
  }

  // Méthode pour gérer les erreurs d'images
  onImageError(event: any): void {
    console.warn('Image non trouvée:', event.target.src);
    // Remplacer par une image par défaut
    event.target.src = '/assets/images/logo.png';
  }

  // Méthode pour gérer le chargement des images
  onImageLoad(event: any): void {
    event.target.classList.add('loaded');
  }
}
