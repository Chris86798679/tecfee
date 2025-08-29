/* =========
MOTEUR UI
========= */
function el(tag, attrs={}, ...children){
const n = document.createElement(tag);
Object.entries(attrs).forEach(([k,v])=>{
if(k==='class') n.className=v;
else if(k==='html') n.innerHTML=v;
else if(k.startsWith('on') && typeof v==='function') n.addEventListener(k.slice(2), v);
else n.setAttribute(k,v);
});
children.flat().forEach(c=> n.append(c?.nodeType? c : document.createTextNode(c ?? '')));
return n;
}

function accordionItem(lesson){
const head = el('div',{class:'head', role:'button', 'aria-expanded':'false'},
el('div',{},
el('h4',{}, `${lesson.num}. ${lesson.titre}`),
el('span',{class:`badge bloc${lesson.bloc}`}, `Bloc ${lesson.bloc}`)
),
el('div',{}, lesson.complet ? '' : el('span',{class:'badge soon'},'Bientôt'))
);
const body = el('div',{class:'body'});
const wrap = el('section',{class:'lesson', id:`lesson-${lesson.num}`}, head, body);
head.addEventListener('click', ()=>{
const isOpen = wrap.classList.toggle('open');
head.setAttribute('aria-expanded', String(isOpen));
});

if(lesson.complet){
// Règles
if(lesson.regles?.length){
const rulesBox = el('div',{});
lesson.regles.forEach(r=>{
rulesBox.append(
el('div',{class:'rule'},
el('h5',{}, r.titre),
el('p',{}, r.texte)
)
);
});
body.append(rulesBox);
}
// Exemples
if(lesson.exemples?.length){
body.append(el('h5',{}, 'Exemples'));
const ul = el('ul',{class:'exemples'});
lesson.exemples.forEach(ex=> ul.append(el('li',{}, ex)));
body.append(ul);
}
// Quiz
if(lesson.exercices?.length){
body.append(el('h5',{}, 'Exercices'));
const quizBox = el('div',{class:'quiz'});
lesson.exercices.forEach((q,i)=>{
quizBox.append(renderExercise(q, `${lesson.num}-${i+1}`));
});
body.append(quizBox);
// Boutons globaux
const controls = el('div',{class:'controls'},
el('button',{class:'btn primary', onclick:()=> correctLesson(quizBox)},'Corriger tout'),
el('button',{class:'btn ghost', onclick:()=> resetLesson(quizBox)},'Réinitialiser')
);
body.append(controls);
}
}
return wrap;
}

function renderExercise(q, key){
const box = el('div',{class:'item', 'data-type': q.type || 'qcm'});
let inputArea;
if(q.type==='qcm'){
inputArea = el('div',{});
q.choices.forEach((c,idx)=>{
const id=`q-${key}-${idx}`;
inputArea.append(
el('label',{}, el('input',{type:'radio', name:`q-${key}`, value:String(idx)}), ' ', c)
);
});
} else if(q.type==='texte'){
inputArea = el('div',{},
el('input',{type:'text', placeholder:'Réponse', 'data-answer': q.answer})
);
} else if(q.type==='multi'){
inputArea = el('div',{});
q.choices.forEach((c,idx)=>{
inputArea.append(
el('label',{}, el('input',{type:'checkbox', value:c}), ' ', c)
);
});
inputArea.setAttribute('data-answer', JSON.stringify(q.answer.sort()));
}
const feedback = el('div',{class:'feedback', role:'status'});
const row = el('div',{class:'controls'},
el('button',{class:'btn ghost', onclick:()=>correctOne(box,q)},'Vérifier'),
el('button',{class:'btn ghost', onclick:()=>resetOne(box)},'Effacer')
);
box.append(el('p',{}, q.prompt), inputArea, row, feedback);
return box;
}

function getUserResponse(box){
const type = box.getAttribute('data-type');
if(type==='qcm'){
const sel = box.querySelector('input[type=radio]:checked');
return sel ? sel.value : null;
} else if(type==='texte'){
return (box.querySelector('input[type=text]')?.value||'').trim();
} else if(type==='multi'){
const vals = [...box.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value);
return vals.sort();
}
return null;
}

function correctOne(box, q){
const fb = box.querySelector('.feedback');
const type = box.getAttribute('data-type');
const user = getUserResponse(box);
let ok = false, solution = q.solution ?? q.answer;

if(type==='qcm'){
ok = String(user) === String(solution);
} else if(type==='texte'){
ok = user?.toLowerCase() === String(solution).toLowerCase();
} else if(type==='multi'){
ok = JSON.stringify(user) === JSON.stringify((solution||[]).sort());
}
fb.textContent = ok ? (q.explainOk || '✅ Correct !') : (q.explainKo || `❌ Incorrect. Réponse attendue : ${pretty(solution, q)}`);
fb.className = 'feedback ' + (ok? 'ok' : 'ko');
box.classList.toggle('solved', ok);
}

function resetOne(box){
box.querySelectorAll('input[type=radio]').forEach(i=> i.checked=false);
box.querySelectorAll('input[type=checkbox]').forEach(i=> i.checked=false);
const t = box.querySelector('input[type=text]'); if(t) t.value='';
const fb = box.querySelector('.feedback'); fb.textContent=''; fb.className='feedback';
box.classList.remove('solved');
}

function correctLesson(quizBox){
quizBox.querySelectorAll('.item').forEach((item)=>{
const idx = [...quizBox.children].indexOf(item);
const q = JSON.parse(item.getAttribute('data-q')||'null');
// fallback : si pas stocké, on recalcule à partir du DOM (moins précis)
const btn = item.querySelector('button');
btn?.click();
});
}
function resetLesson(quizBox){
quizBox.querySelectorAll('.item').forEach(resetOne);
}

function pretty(sol, q){
if(Array.isArray(sol)) return sol.join(', ');
if(q && q.type==='qcm') return q.choices?.[Number(sol)] ?? sol;
return String(sol);
}

/* =========
DONNÉES COURS
(20 leçons remplies, 30 à compléter)
========= */

const LESSONS = [
/* ===== Bloc 1 – Orthographe d’usage ===== */
{
num:1, bloc:1, titre:"L’accord des adjectifs",
complet:true,
regles:[
{titre:"Principe général",
texte:"L’adjectif qualificatif s’accorde en genre et en nombre avec le nom qu’il qualifie. Ex. : des fleurs rouges ; un manteau noir."},
{titre:"Cas particuliers",
texte:"Couleurs composées restent invariables (bleu marine), mais un nom de couleur adjectivé s’accorde (des robes oranges)."}
],
exemples:[
"Une voiture neuve / des voitures neuves.",
"Des chemises bleu marine (invariable).",
"Des foulards oranges (orange = nom devenu adjectif)."
],
exercices:[
{type:'qcm', prompt:"Choisis la forme correcte : des maisons (blanc / blanches).", choices:["blanc","blanches"], solution:1},
{type:'texte', prompt:"Complète : une jupe ___ (mauve).", answer:"mauve"},
{type:'multi', prompt:"Coche les adjectifs qui doivent s’accorder :", choices:["bleu marine","orange","noir","kaki"], answer:["orange","noir"]}
]
},
{
num:2, bloc:1, titre:"Homophones : et/est – on/ont – son/sont",
complet:true,
regles:[
{titre:"et / est", texte:"et = coordonne (addition) ; est = verbe être (il est)."},
{titre:"on / ont", texte:"on = pronom indéfini ; ont = verbe avoir (ils ont)."},
{titre:"son / sont", texte:"son = déterminant possessif ; sont = verbe être (ils sont)."}
],
exemples:[
"Paul et Marie viennent. / Il est content.",
"On part tôt. / Ils ont (ont) gagné.",
"Son sac est là. / Ils sont déjà là."
],
exercices:[
{type:'qcm', prompt:"Il ___ (et / est) en retard.", choices:["et","est"], solution:1},
{type:'qcm', prompt:"Ils ___ (on / ont) terminé.", choices:["on","ont"], solution:1},
{type:'qcm', prompt:"___ ami arrive. (son / sont)", choices:["son","sont"], solution:0}
]
},
{
num:3, bloc:1, titre:"Les accents",
complet:true,
regles:[
{titre:"É / È / Ê", texte:"é (fermé) souvent en fin de mot ; è (ouverture) avant deux consonnes ; ê dans formes dérivées (fête)."},
{titre:"À / Ç", texte:"à = préposition ; ç devant a, o, u pour conserver le son [s] (garçon)."}
],
exemples:["événement, collège, relève ; très, prêt ; garçon, reçu, à côté"],
exercices:[
{type:'texte', prompt:"Complète avec l’accent : et___ (etudiant→…)", answer:"étudiant"},
{type:'qcm', prompt:"Choisis : garcon / garçon", choices:["garcon","garçon"], solution:1},
{type:'qcm', prompt:"Préposition correcte : a / à", choices:["a","à"], solution:1}
]
},
{
num:4, bloc:1, titre:"Participe passé avec « être »",
complet:true,
regles:[
{titre:"Règle", texte:"Avec l’auxiliaire être, le participe passé s’accorde en genre et en nombre avec le sujet."}
],
exemples:["Elles sont arrivées. / Il est parti. / Marie et Paul sont venus."],
exercices:[
{type:'texte', prompt:"Elles sont ___ (arriver).", answer:"arrivées"},
{type:'qcm', prompt:"Il est ___ (parti/partie).", choices:["parti","partie"], solution:0},
{type:'qcm', prompt:"Marie et Paul sont ___ (venu / venus).", choices:["venu","venus"], solution:1}
]
},
{
num:5, bloc:1, titre:"Pluriels particuliers",
complet:true,
regles:[
{titre:"Mots en -al", texte:"-al → -aux (cheval/chevaux) sauf bal, carnaval, festival, etc. (bals…)."},
{titre:"Mots en -ou", texte:"-ou → -oux (bijou, chou, genou, hibou, joujou, caillou, pou)."}
],
exemples:["un cheval → des chevaux ; un bal → des bals ; un bijou → des bijoux"],
exercices:[
{type:'qcm', prompt:"Pluralise : un cheval → des ___", choices:["chevals","chevaux"], solution:1},
{type:'qcm', prompt:"Pluralise : un bal → des ___", choices:["baux","bals"], solution:1},
{type:'texte', prompt:"Pluralise : un chou → des ___", answer:"choux"}
]
},

/* ===== Bloc 2 – Orthographe grammaticale ===== */
{
num:16, bloc:2, titre:"Participe passé avec « avoir » (COD avant)",
complet:true,
regles:[
{titre:"Règle", texte:"Avec « avoir », le participe s’accorde avec le COD si celui-ci est placé avant le verbe."},
{titre:"Astuce", texte:"Repère le COD (qui ? quoi ?) et vérifie s’il est AVANT."}
],
exemples:[
"Les lettres que j’ai écrites (écrites = COD lettres, avant).",
"J’ai écrit des lettres (pas d’accord, COD après)."
],
exercices:[
{type:'texte', prompt:"Les fleurs qu’elle a ___ (cueillir) sont fraîches.", answer:"cueillies"},
{type:'qcm', prompt:"J’ai ___ (mangé / mangée) des pommes.", choices:["mangé","mangée"], solution:0},
{type:'qcm', prompt:"Les pommes que j’ai ___ (mangé/mangées).", choices:["mangé","mangées"], solution:1}
]
},
{
num:17, bloc:2, titre:"Participe passé avec « en »",
complet:true,
regles:[{titre:"Règle", texte:"Le participe passé reste généralement invariable avec « en » COD partitif : Des fautes, j’en ai commis (beaucoup)."}],
exemples:["Des livres ? J’en ai lu beaucoup (lu invariable)."],
exercices:[
{type:'qcm', prompt:"Des idées ? J’en ai ___ (retenu / retenues) quelques-unes.", choices:["retenu","retenues"], solution:0},
{type:'qcm', prompt:"Des erreurs ? Il en a ___ (fait/faites).", choices:["fait","faites"], solution:0},
{type:'texte', prompt:"Complète : Des fruits ? J’en ai ___ (manger) trop.", answer:"mangé"}
]
},
{
num:18, bloc:2, titre:"Verbes pronominaux",
complet:true,
regles:[
{titre:"Règle", texte:"Accord si le pronom est COD (se) ; pas d’accord s’il est COI."},
{titre:"Exemple", texte:"Ils se sont parlé (COI → invariable). / Elles se sont vues (COD → accord)."}
],
exemples:["Ils se sont téléphoné. / Elles se sont lavées (elles-mêmes)."],
exercices:[
{type:'qcm', prompt:"Elles se sont ___ (parlé / parlées).", choices:["parlé","parlées"], solution:0},
{type:'qcm', prompt:"Elles se sont ___ (vu / vues).", choices:["vu","vues"], solution:1},
{type:'texte', prompt:"Ils se sont ___ (téléphoner).", answer:"téléphoné"}
]
},
{
num:19, bloc:2, titre:"Tout / tous / toute / toutes",
complet:true,
regles:[
{titre:"Accord", texte:"« tout » adjectif s’accorde ; pronom varie ; adverbe « tout » peut être invariable devant adjectif fém. commençant par consonne (toute petite) → mais variable devant voyelle (tout émue / toute émue selon usage actuel) — admet les deux."}
],
exemples:["toute la classe ; tous les jours ; elles sont tout/toutes étonnées (les deux admis)."],
exercices:[
{type:'qcm', prompt:"___ le monde est prêt. (Tout/Tous)", choices:["Tout","Tous"], solution:0},
{type:'qcm', prompt:"Elles sont ___ heureuses. (tout/toutes)", choices:["tout","toutes"], solution:1},
{type:'texte', prompt:"Complète : ___ les jours.", answer:"tous"}
]
},
{
num:20, bloc:2, titre:"Adverbes en -ment",
complet:true,
regles:[
{titre:"Formation", texte:"Adj. fém. + -ment (heureuse → heureusement). Adj. en -ant → -amment, en -ent → -emment (bruyant → bruyamment ; patient → patiemment)."}
],
exemples:["vrai → vraiment ; évident → évidemment ; prudent → prudemment"],
exercices:[
{type:'texte', prompt:"Forme adverbiale : « évident » → ___", answer:"évidemment"},
{type:'qcm', prompt:"bruyant → ?", choices:["bruyantement","bruyamment"], solution:1},
{type:'qcm', prompt:"patient → ?", choices:["patientement","patiemment"], solution:1}
]
},

/* ===== Bloc 3 – Ponctuation & Syntaxe ===== */
{
num:31, bloc:3, titre:"La virgule",
complet:true,
regles:[
{titre:"Usages principaux", texte:"Énumérations, incises, propositions subordonnées non essentielles. Jamais entre sujet et verbe."}
],
exemples:["Paul, fatigué, s’est assis. / Elle aime les pommes, les poires et les pêches."],
exercices:[
{type:'qcm', prompt:"Placer une virgule ? « Les élèves qui travaillent réussissent. »", choices:["Oui","Non"], solution:1},
{type:'qcm', prompt:"« Paul fatigué s’est assis » → virgules ?", choices:["Paul, fatigué, s’est assis","Paul, fatigué s’est assis"], solution:0},
{type:'texte', prompt:"Complète avec une virgule : « Je viens ___ tu pars. »", answer:","}
]
},
{
num:32, bloc:3, titre:"Le point-virgule",
complet:true,
regles:[
{titre:"Rôle", texte:"Sépare des propositions déjà pourvues de virgules ou très liées sans conjonction."}
],
exemples:["Il pleuvait ; nous sommes restés."],
exercices:[
{type:'qcm', prompt:"Choisis le meilleur signe : « Il hésite ___ il accepte. »", choices:[",",";","—"], solution:1},
{type:'qcm', prompt:"Le point-virgule est surtout utile pour :", choices:["Relier deux phrases très liées","Introduire une liste verticale"], solution:0},
{type:'texte', prompt:"Complète par « ; » : « Je suis venu ___ tu n’y étais pas. »", answer:";"}
]
},
{
num:33, bloc:3, titre:"Les deux-points",
complet:true,
regles:[
{titre:"Usages", texte:"Annonce d’explication, citation, énumération. Espace insécable avant en français."}
],
exemples:["Il pense ceci : il faut partir. / Elle a dit : « Je viens. »"],
exercices:[
{type:'qcm', prompt:"Choisis le signe : « Il a trois qualités ___ patience courage humour. »", choices:[";","—",":"], solution:2},
{type:'qcm', prompt:"Les deux-points peuvent introduire :", choices:["Une explication","Une subordonnée relative"], solution:0},
{type:'texte', prompt:"Tape le signe attendu (deux-points) : ___", answer:":"}
]
},
{
num:36, bloc:3, titre:"Propositions subordonnées (que/qui/où/quand)",
complet:true,
regles:[
{titre:"Repères", texte:"Subordonnée relative (qui/que/où/dont…), complétive (que), circonstancielle (quand, parce que…)."}
],
exemples:["Le livre que j’ai lu ; Je pense qu’il vient ; Quand il pleut, je lis."],
exercices:[
{type:'qcm', prompt:"Type de subordonnée : « Je pense qu’il viendra. »", choices:["relative","complétive","circonstancielle"], solution:1},
{type:'qcm', prompt:"Mot subordonnant : « La ville ___ je rêve. »", choices:["qui","où","que"], solution:1},
{type:'qcm', prompt:"« Quand il pleut, je lis. » → type ?", choices:["relative","complétive","circonstancielle"], solution:2}
]
},
{
num:37, bloc:3, titre:"Introduction à la syntaxe (fonctions)",
complet:true,
regles:[
{titre:"Fonctions", texte:"Sujet, verbe, COD/COI, attribut du sujet, complément du nom/circonstanciel. Identifier le verbe d’abord."}
],
exemples:["Paul mange une pomme (COD). / Elle est médecin (attribut)."],
exercices:[
{type:'qcm', prompt:"Fonction de « une pomme » : Paul mange une pomme.", choices:["sujet","COD","COI"], solution:1},
{type:'qcm', prompt:"Fonction de « médecin » : Elle est médecin.", choices:["attribut du sujet","COD"], solution:0},
{type:'qcm', prompt:"Dans « Il parle à Marie », « à Marie » est :", choices:["COD","COI"], solution:1}
]
},
{
num:40, bloc:3, titre:"Révision syntaxe et ponctuation",
complet:true,
regles:[
{titre:"À retenir", texte:"Jamais de virgule entre sujet et verbe ; choisir entre virgule/point-virgule/deux-points selon le lien logique."}
],
exemples:["La phrase, bien ponctuée, est claire ; elle guide le lecteur : elle structure le sens."],
exercices:[
{type:'qcm', prompt:"Virgule entre sujet et verbe ?", choices:["oui","non"], solution:1},
{type:'qcm', prompt:"Signe le plus logique pour une explication :", choices:[",",";",":"], solution:2},
{type:'qcm', prompt:"Point-virgule pour :", choices:["Idées très liées","Coupure forte non liée"], solution:0}
]
},

/* ===== Bloc 4 – Vocabulaire & Structures ===== */
{
num:41, bloc:4, titre:"Faux amis",
complet:true,
regles:[
{titre:"Définition", texte:"Mots ressemblant à d’autres (anglais/français) mais au sens différent (actually/actuellement → en fait/actuellement)."}
],
exemples:["library = bibliothèque (pas librairie) ; sensible = qui a du bon sens (pas sensitive)."],
exercices:[
{type:'qcm', prompt:"Traduction correcte de « library » :", choices:["librairie","bibliothèque"], solution:1},
{type:'qcm', prompt:"« Actually » se traduit le plus souvent par :", choices:["actuellement","en fait"], solution:1},
{type:'texte', prompt:"Complète : « sensible » en anglais → ___ (français).", answer:"sensible"}
]
},
{
num:42, bloc:4, titre:"Anglicismes",
complet:true,
regles:[
{titre:"Principe", texte:"Privilégier les équivalents français : courriel (email), fin de semaine (weekend), clavardage (chat)."}
],
exemples:["Je t’envoie un courriel. / Fin de semaine prochaine."],
exercices:[
{type:'qcm', prompt:"Choisis l’équivalent français : « chat »", choices:["bavardage","clavardage"], solution:1},
{type:'qcm', prompt:"Choisis l’équivalent : « weekend »", choices:["fin de semaine","semaine de fin"], solution:0},
{type:'texte', prompt:"Remplace : « email » → ___", answer:"courriel"}
]
},
{
num:45, bloc:4, titre:"Paronymes",
complet:true,
regles:[
{titre:"Définition", texte:"Mots proches par la forme mais de sens différents : allocation/allocation, effraction/infraction, éruption/irruption."}
],
exemples:["Il a commis une infraction (et non effraction). / Une irruption de foule ≠ éruption volcanique."],
exercices:[
{type:'qcm', prompt:"Correct : « Il a commis une ___ au code. »", choices:["effraction","infraction"], solution:1},
{type:'qcm', prompt:"Correct : « L’___ du volcan. »", choices:["irruption","éruption"], solution:1},
{type:'texte', prompt:"Complète : entrée brusque d’une foule = ___", answer:"irruption"}
]
},
{
num:46, bloc:4, titre:"Connecteurs logiques",
complet:true,
regles:[
{titre:"Rôles", texte:"Addition (et, de plus), opposition (mais, toutefois), cause (car, puisque), conséquence (donc, ainsi), concession (bien que)."}
],
exemples:["Il pleut, donc je reste. / Bien que fatigué, il sort."],
exercices:[
{type:'qcm', prompt:"Choisis un connecteur de conséquence :", choices:["car","donc","mais"], solution:1},
{type:'qcm', prompt:"« Bien que » introduit :", choices:["opposition","concession","cause"], solution:1},
{type:'texte', prompt:"Complète : « Il travaille ___ il progresse. » (conséquence)", answer:"donc"}
]
},
{
num:47, bloc:4, titre:"Cohérence textuelle",
complet:true,
regles:[
{titre:"Principes", texte:"Progression thématique, enchaînement logique, reprise pronominale/lexicale, éviter les ruptures."}
],
exemples:["Paul a un chat. Cet animal est gentil. → Reprise lexicale/pronominale."],
exercices:[
{type:'qcm', prompt:"La cohérence vise surtout :", choices:["l’orthographe","l’enchaînement des idées"], solution:1},
{type:'qcm', prompt:"« En revanche » marque :", choices:["cause","opposition"], solution:1},
{type:'texte', prompt:"Connecteur d’addition : ___", answer:"de plus"}
]
},
{
num:48, bloc:4, titre:"Figures de style (aperçu)",
complet:true,
regles:[
{titre:"Exemples", texte:"Comparaison, métaphore, hyperbole, anaphore. Retenir l’effet produit, pas seulement la définition."}
],
exemples:["« Fort comme un lion » (comparaison) ; « une mer de blé » (métaphore)."],
exercices:[
{type:'qcm', prompt:"« Cette femme est un soleil » :", choices:["comparaison","métaphore"], solution:1},
{type:'qcm', prompt:"« Mourir de rire » :", choices:["hyperbole","anaphore"], solution:0},
{type:'texte', prompt:"Figure qui répète en début de phrase : ___", answer:"anaphore"}
]
},
{
num:49, bloc:4, titre:"Registre de langue",
complet:true,
regles:[
{titre:"Registres", texte:"Soutenu, courant, familier. Au TECFÉE, privilégier le registre courant/soutenu."}
],
exemples:["Familier : « J’sais pas » → Courant : « Je ne sais pas. »"],
exercices:[
{type:'qcm', prompt:"Choisis la version TECFÉE :", choices:["J’suis crevé","Je suis très fatigué"], solution:1},
{type:'qcm', prompt:"Niveau : « Veuillez patienter. »", choices:["familier","soutenu"], solution:1},
{type:'texte', prompt:"Réécris « Il a pas » (registre courant) : ___", answer:"Il n’a pas"}
]
},
{
num:50, bloc:4, titre:"Épreuve de rédaction (plan + exemple)",
complet:true,
regles:[
{titre:"Plan conseillé", texte:"Intro (sujet + thèse), 2-3 arguments (paragraphe = idée directrice + preuve + exemple), contre-argument (si pertinent), conclusion (bilan + ouverture)."},
{titre:"Critères", texte:"Clarté, logique, correction linguistique, richesse lexicale, ponctuation maîtrisée."}
],
exemples:["Ex. de thèse : « Le télétravail améliore la qualité de vie. » → arguments : flexibilité, productivité, environnement."],
exercices:[
{type:'texte', prompt:"Donne un connecteur d’exemple :", answer:"par exemple"},
{type:'qcm', prompt:"Place du contre-argument :", choices:["introduction","développement"], solution:1},
{type:'qcm', prompt:"Conclusion = ", choices:["nouvel argument","bilan + ouverture"], solution:1}
]
},

/* Marque les autres leçons comme « Bientôt » */
...Array.from({length:30}, (_,i)=> {
// Répartit les numéros restants hors des 20 remplis ci-dessus
const filled = new Set([1,2,3,4,5,16,17,18,19,20,31,32,33,36,37,40,41,42,45,46,47,48,49,50]);
// on génère des coquilles pour ceux qui manquent (sautés)
return { num: 6 + i, bloc: ( (6+i)<=15?1 : ( (6+i)<=30?2 : ( (6+i)<=40?3:4) ) ),
titre: "Contenu à venir", complet: filled.has(6+i) };
}).filter(x=> !x.complet)
];

/* =========
PAGE BUILDER
========= */
function buildCoursePage(opts){
const mount = document.getElementById(opts.mountId);
const search = document.getElementById(opts.searchId);
const filter = document.getElementById(opts.filterId);
const expandAll = document.getElementById(opts.expandBtnId);
const collapseAll = document.getElementById(opts.collapseBtnId);

let data = LESSONS.sort((a,b)=> a.num-b.num);

function render(){
mount.innerHTML='';
const q = (search.value||'').toLowerCase();
const bloc = filter.value;
const list = data.filter(d=>{
const okBloc = !bloc || String(d.bloc)===String(bloc);
const okSearch = !q || (`${d.num} ${d.titre}`.toLowerCase().includes(q));
return okBloc && okSearch;
});
if(!list.length){
mount.append(el('div',{class:'tip'}, "Aucun résultat pour ta recherche."));
return;
}
list.forEach(lesson=> mount.append(accordionItem(lesson)));
}

search?.addEventListener('input', render);
filter?.addEventListener('change', render);
expandAll?.addEventListener('click', ()=>{
mount.querySelectorAll('.lesson').forEach(x=> x.classList.add('open'));
mount.querySelectorAll('.lesson .head').forEach(h=> h.setAttribute('aria-expanded','true'));
});
collapseAll?.addEventListener('click', ()=>{
mount.querySelectorAll('.lesson').forEach(x=> x.classList.remove('open'));
mount.querySelectorAll('.lesson .head').forEach(h=> h.setAttribute('aria-expanded','false'));
});

render();
}
