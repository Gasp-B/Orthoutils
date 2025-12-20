"use client";

import React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  Filter, 
  LayoutGrid, 
  List as ListIcon,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  ChevronRight // <--- Ajouté ici
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATS = {
  total: 12,
  published: 8,
  drafts: 4,
};

const MOCK_TESTS = [
  {
    id: "1",
    title: "Évaluation du Langage Oral (ELO-5)",
    description: "Batterie complète pour le dépistage des troubles phonologiques et lexicaux chez l'enfant de 5 ans.",
    status: "published",
    updatedAt: "20/12/2024",
    domain: "Langage Oral",
    completness: 100,
  },
  {
    id: "2",
    title: "Test de Mémoire de Travail",
    description: "Épreuves de répétition de chiffres et de mots pour évaluer la boucle phonologique.",
    status: "draft",
    updatedAt: "18/12/2024",
    domain: "Mémoire",
    completness: 60,
  },
  {
    id: "3",
    title: "Lecture Silencieuse Rapide",
    description: "Test de vitesse et de compréhension en lecture silencieuse.",
    status: "archived",
    updatedAt: "10/11/2024",
    domain: "Langage Écrit",
    completness: 100,
  },
];

export default function TestsManagePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const t = useTranslations("Tests");

  return (
    <div className="space-y-8">
      {/* En-tête avec Titre et Bouton d'action principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mes Tests</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre bibliothèque d'outils cliniques et suivez leurs statuts.
          </p>
        </div>
        <Link href="/tests/manage/create">
          <Button className="w-full sm:w-auto shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Créer un nouveau test
          </Button>
        </Link>
      </div>

      {/* Cartes de statistiques (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.total}</div>
            <p className="text-xs text-muted-foreground">Outils dans votre bibliothèque</p>
          </CardContent>
        </Card>
        <Card className="bg-white/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.published}</div>
            <p className="text-xs text-muted-foreground">Visibles par vos collègues</p>
          </CardContent>
        </Card>
        <Card className="bg-white/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{STATS.drafts}</div>
            <p className="text-xs text-muted-foreground">En cours de rédaction</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Barre d'outils : Recherche, Filtres, Vues */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex w-full sm:w-auto items-center gap-2 flex-1">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, mot-clé..."
              className="pl-9 bg-background"
            />
          </div>
          <Button variant="outline" title="Filtres avancés" className="px-3">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Tabs defaultValue="grid" className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="list"><ListIcon className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Grille des résultats */}
      {MOCK_TESTS.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TESTS.map((test) => (
            <Card key={test.id} className="group flex flex-col hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary">
              <CardHeader className="pb-3 relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={test.status === 'published' ? 'default' : 'outline'}
                      className={test.status === 'draft' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                    >
                      {test.status === 'published' ? 'Publié' : test.status === 'draft' ? 'Brouillon' : 'Archivé'}
                    </Badge>
                  </div>
                   {/* Remplacement du DropdownMenu par des boutons directs */}
                   <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Modifier">
                        <Link href={`/tests/manage/edit/${test.id}`}>
                           <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Supprimer">
                         <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                   </div>
                </div>
                
                <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {test.title}
                </CardTitle>
                <div className="mt-1">
                   <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block">
                    {test.domain}
                   </span>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px] mt-2">
                  {test.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3 flex-grow">
                 {/* Barre de complétion pour les brouillons */}
                 {test.status === 'draft' && (
                   <div className="space-y-1 mt-2">
                     <div className="flex justify-between text-xs text-muted-foreground">
                       <span>Complétion</span>
                       <span>{test.completness}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-orange-400 rounded-full" 
                         style={{ width: `${test.completness}%` }}
                       />
                     </div>
                   </div>
                 )}
              </CardContent>

              <CardFooter className="pt-3 border-t bg-muted/10 flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {test.updatedAt}
                </div>
                <Link href={`/tests/manage/edit/${test.id}`} className="hover:underline font-medium text-primary flex items-center">
                  Ouvrir <ChevronRight className="h-3 w-3 ml-0.5"/>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-xl bg-muted/5">
          <div className="bg-muted p-4 rounded-full mb-4">
             <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">Aucun test trouvé</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
            Vous n'avez pas encore créé de test ou votre recherche ne donne aucun résultat.
          </p>
          <Link href="/tests/manage/create">
            <Button>Créer mon premier test</Button>
          </Link>
        </div>
      )}
    </div>
  );
}