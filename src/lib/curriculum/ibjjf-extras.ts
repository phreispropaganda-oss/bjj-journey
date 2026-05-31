// Módulos IBJJF best-effort por faixa
// Conteúdo baseado em currículos IBJJF reconhecidos (Mendes, Atos, Alliance, Gracie).
// Ajustar com seu professor — currículo IBJJF não tem norma técnica oficial pública.

import type { Module, Technique } from './index'

function tech(
  name: string,
  entryPosition: string,
  description: string,
  steps: string[],
  commonMistake: string,
  tip: string,
  youtubeQuery?: string,
): Technique {
  return {
    name, entryPosition, description, steps,
    commonMistake, tip,
    youtubeQuery: youtubeQuery ?? `${name} jiu jitsu`,
  }
}

// ─── BRANCA — módulos adicionais ───
export const WHITE_EXTRA_MODULES: Module[] = [
  {
    id: 'w-quedas-basicas', number: '04', label: 'Quedas básicas (IBJJF)', icon: 'arrow-down-up',
    color: '#0EA5E9', colorBg: '#E0F2FE',
    description: 'Fundamentos de derrubada permitidos no IBJJF — base, pegada, distância e ataques essenciais.',
    categories: [
      {
        id: 'w-q1', name: 'Pegada e postura', icon: 'hand', color: '#0EA5E9', bgColor: '#E0F2FE', textColor: '#0369A1',
        techniques: [
          tech('Pegada cruzada (kumi-kata) básica', 'Em pé, frente a frente.',
            'Pegada padrão IBJJF: gola cruzada e manga oposta. Base larga, joelhos flexionados.',
            ['Mão dominante puxa a gola perto do colarinho do oponente',
             'Mão fraca segura a manga oposta na altura do cotovelo',
             'Distância igual ao próprio braço estendido',
             'Quadril levemente flexionado, peso nos dedos dos pés',
             'Olhe para o esterno do oponente, não para baixo'],
            'Soltar a pegada ao tentar puxar e expor o pescoço.',
            'Treine apenas a pegada por 1 minuto antes de tentar quedas.',
          ),
          tech('Puxada de guarda controlada', 'Pegada estabelecida, oponente em pé.',
            'Sentar de forma segura para começar pela guarda em vez de arriscar a queda.',
            ['Mantenha as duas pegadas (gola + manga)',
             'Coloque o pé livre na curva da virilha do oponente',
             'Desça a bunda lentamente, puxando-se para baixo do oponente',
             'Imediatamente engate guarda fechada ou aberta',
             'Se cair de lado, recomponha guarda imediatamente'],
            'Soltar a pegada na descida e ser passado.',
            'Treinador: cuidado para não punir com 2 pontos no IBJJF — execute a puxada ágil.',
          ),
        ],
      },
      {
        id: 'w-q2', name: 'Quedas fundamentais', icon: 'arrow-down', color: '#0EA5E9', bgColor: '#E0F2FE', textColor: '#0369A1',
        techniques: [
          tech('Double leg (baiana)', 'Frente a frente, distância média.',
            'Penetração nas duas pernas — a queda mais usada para iniciantes IBJJF.',
            ['Step de penetração com o pé dominante entre as pernas dele',
             'Joelho dominante toca o tatame ou quase',
             'Cabeça ao lado do quadril dele, NUNCA no centro',
             'Abrace as duas pernas e drive lateral com o ombro',
             'Aterrize em controle lateral, mantendo a pegada da perna inferior'],
            'Dropar a cabeça no centro — risco de guilhotina.',
            'Treine first o stepping antes do shoot completo.',
          ),
          tech('Single leg (uma perna)', 'Frente a frente.',
            'Captura de uma perna seguida de finish lateral ou drive.',
            ['Mão de fora controla atrás do joelho dele',
             'Mão de dentro entra por baixo da virilha',
             'Cabeça do lado de fora pressionando o quadril dele',
             'Eleve a perna até a altura da cintura',
             'Use 1 dos 3 finishes: outside trip, run-the-pipe ou dump'],
            'Cabeça do lado errado, deixando guilhotina exposta.',
            'No IBJJF, deixar a queda lenta = 2 pontos garantidos.',
          ),
          tech('Sumi gaeshi adaptado (tomoe nage)', 'Pegada cruzada estabelecida.',
            'Sacrifício para baixo, projeção por cima do pé.',
            ['Recue um passo ganhando reação dele para frente',
             'Sente segurando a pegada cruzada com firmeza',
             'Pé no quadril dele (não na barriga)',
             'Estenda a perna projetando-o por cima de você',
             'Role para topo ou termine em raspagem'],
            'Errar a colocação do pé e ser passado.',
            'Funciona melhor com oponente que avança forte.',
          ),
        ],
      },
    ],
  },
  {
    id: 'w-ataques-fechada', number: '05', label: 'Ataques da guarda fechada', icon: 'shield-half',
    color: '#9333EA', colorBg: '#F3E8FF',
    description: 'A guarda fechada é a primeira "casa" do jiu-jitsuka — daqui saem ataques que toda faixa branca precisa dominar.',
    categories: [
      {
        id: 'w-af1', name: 'Estrangulamentos', icon: 'circle-x', color: '#9333EA', bgColor: '#F3E8FF', textColor: '#7E22CE',
        techniques: [
          tech('Cruzado simples (cross collar)', 'Guarda fechada.',
            'Estrangulamento clássico usando a própria gola do oponente.',
            ['Mão direita entra fundo na gola direita dele, palma para cima',
             'Mão esquerda entra na gola esquerda, polegar por dentro',
             'Puxe os cotovelos para baixo aproximando as mãos',
             'Levante o quadril ligeiramente para aproximá-lo',
             'Pressione com os antebraços nas carótidas (não o pescoço)'],
            'Apertar com força no centro do pescoço — não estrangula.',
            'A pressão vem dos cotovelos para baixo, não da força das mãos.',
          ),
          tech('Estrangulamento do braço (loop choke)', 'Guarda fechada, pegada cruzada.',
            'Volta da lapela ao redor do pescoço dele.',
            ['Mão segura a gola cruzada profunda',
             'Mão livre puxa a cabeça dele para baixo',
             'Passe o braço por trás da cabeça e enrole a lapela',
             'Cruze as pernas pressionando o quadril dele para baixo',
             'Estenda os quadris e puxe a lapela em direção oposta'],
            'Não fechar o loop completamente.',
            'É um estrangulamento "sem mãos" — toda a força vem do quadril.',
          ),
        ],
      },
      {
        id: 'w-af2', name: 'Chaves de braço', icon: 'arm', color: '#9333EA', bgColor: '#F3E8FF', textColor: '#7E22CE',
        techniques: [
          tech('Chave de braço (armbar) da guarda', 'Guarda fechada, pegada na manga.',
            'A finalização mais clássica da guarda fechada IBJJF.',
            ['Pegada na manga e na lapela do mesmo lado',
             'Coloque o pé do lado oposto no quadril dele',
             'Quadril levanta e gira 90°, projetando perna por cima da cabeça',
             'Perna desce sobre o rosto/cabeça dele',
             'Junte os joelhos, segure o punho e estenda o quadril'],
            'Não fechar bem o ângulo — armbar escapa pelo cotovelo.',
            'Cabeça do oponente DEVE ir para o tatame.',
          ),
          tech('Triângulo da guarda fechada', 'Guarda fechada, pegada na manga.',
            'Estrangula com a própria perna do oponente.',
            ['Empurre o joelho dele para fora abrindo espaço',
             'Sua perna entra por dentro e por cima do ombro dele',
             'O outro ombro fica para fora',
             'Encaixe a panturrilha atrás do joelho oposto',
             'Puxe a cabeça dele e estenda o quadril'],
            'Deixar os dois braços dele dentro — não é triângulo.',
            'Ângulo de 45° aumenta muito a pressão.',
          ),
        ],
      },
    ],
  },
]

// ─── AZUL — módulos adicionais ───
export const BLUE_EXTRA_MODULES: Module[] = [
  {
    id: 'b-guarda-aberta', number: '04', label: 'Guarda aberta — fundamentos', icon: 'expand',
    color: '#16A34A', colorBg: '#DCFCE7',
    description: 'Sair da guarda fechada para a aberta — sistema essencial para a faixa azul.',
    categories: [
      {
        id: 'b-ga1', name: 'Guardas com pegada', icon: 'grip-vertical', color: '#16A34A', bgColor: '#DCFCE7', textColor: '#15803D',
        techniques: [
          tech('De La Riva (DLR) básica', 'Guarda aberta, oponente em pé.',
            'Pé enrolado por fora do joelho do passador, gancho na perna.',
            ['Pé externo "gancha" por fora do joelho do oponente',
             'Pegada na manga oposta e no tornozelo dele',
             'Pé livre apoia no quadril dele',
             'Use a DLR para puxar e desbalancear',
             'Mantenha tensão no gancho da perna'],
            'Pé sem gancho real — só apoiado.',
            'O gancho é a alma da DLR — sem ele, perde a guarda.',
          ),
          tech('Spider guard (guarda-aranha)', 'Guarda aberta, oponente ajoelhado.',
            'Pés controlam os bíceps do oponente via mangas.',
            ['Pegue as mangas dele',
             'Coloque os dois pés nos bíceps, plantas para fora',
             'Estique uma perna empurrando, dobre a outra',
             'Use combinações de pressão alternada',
             'Mantenha quadril mobile'],
            'Pés rasos — bíceps escorrega.',
            'Calcanhar enganchado ajuda a manter o pé profundo.',
          ),
          tech('Guarda-borboleta', 'Guarda aberta, sentado.',
            'Sentado, ganchos por baixo das coxas do oponente.',
            ['Sente de frente para o oponente',
             'Ganchos por baixo das pernas dele (peito dos pés)',
             'Pegada underhook ou na manga',
             'Quadril ativo — em pé um dos pés se quiser',
             'Ganchos elevam, raspagem clássica'],
            'Deitar de costas — perde a guarda-borboleta.',
            'Mantenha sentado em ângulo, nunca completamente deitado.',
          ),
        ],
      },
    ],
  },
  {
    id: 'b-raspagens', number: '05', label: 'Raspagens essenciais', icon: 'rotate-3d',
    color: '#EAB308', colorBg: '#FEFCE8',
    description: 'Sair de baixo é metade do jogo no IBJJF azul.',
    categories: [
      {
        id: 'b-rs1', name: 'Raspagens da fechada', icon: 'rotate-cw', color: '#EAB308', bgColor: '#FEFCE8', textColor: '#A16207',
        techniques: [
          tech('Raspagem do pêndulo (flower sweep)', 'Guarda fechada.',
            'Raspagem por baixo, usando o quadril como pêndulo.',
            ['Pegada na manga e no joelho do oponente',
             'Abra a guarda e mova o quadril para o lado oposto',
             'Pé do lado dele alavanca por baixo',
             'Quadril gira como pêndulo, joelho dele se levanta',
             'Suba em controle lateral'],
            'Pegada solta — oponente apoia a mão e não rola.',
            'Quanto mais sweep "casca de banana", melhor.',
          ),
        ],
      },
      {
        id: 'b-rs2', name: 'Raspagens da aberta', icon: 'rotate-ccw', color: '#EAB308', bgColor: '#FEFCE8', textColor: '#A16207',
        techniques: [
          tech('Raspagem da borboleta', 'Guarda-borboleta.',
            'Gancho elevador + quedinha lateral.',
            ['Ganchos profundos sob as coxas',
             'Underhook em um dos braços dele',
             'Caia para o lado do underhook',
             'O gancho do mesmo lado eleva a perna dele',
             'Acompanhe o rolamento até a top position'],
            'Cair sem underhook — fica em meia-guarda.',
            'O timing é tão importante quanto a técnica.',
          ),
        ],
      },
    ],
  },
]

// ─── ROXA — módulos adicionais ───
export const PURPLE_EXTRA_MODULES: Module[] = [
  {
    id: 'p-berimbolo', number: '04', label: 'Berimbolo + DLR avançado', icon: 'tornado',
    color: '#7C3AED', colorBg: '#EDE9FE',
    description: 'Sistema moderno IBJJF — DLR invertida e berimbolo para tomar as costas.',
    categories: [
      {
        id: 'p-bb1', name: 'Berimbolo', icon: 'refresh-cw', color: '#7C3AED', bgColor: '#EDE9FE', textColor: '#6D28D9',
        techniques: [
          tech('Berimbolo clássico', 'Reverse DLR estabelecida.',
            'Inversão para tomar as costas via DLR invertida.',
            ['Pé dentro da perna de fora dele (DLRX)',
             'Cabeça desce em direção aos pés dele',
             'Mãos seguram o tornozelo dele',
             'Role por cima do ombro mantendo o gancho',
             'Encaixe os 2 ganchos nas costas dele'],
            'Cabeça erguida — perde a alavancagem.',
            'O berimbolo "rola" — não levanta.',
          ),
        ],
      },
    ],
  },
  {
    id: 'p-leg-drag', number: '05', label: 'Leg drag system', icon: 'route',
    color: '#0891B2', colorBg: '#ECFEFF',
    description: 'Sistema moderno de passagem — leg drag é a base do jogo de passagem da faixa roxa.',
    categories: [
      {
        id: 'p-ld1', name: 'Passagem leg drag', icon: 'arrow-right', color: '#0891B2', bgColor: '#ECFEFF', textColor: '#0E7490',
        techniques: [
          tech('Leg drag entry da guarda aberta', 'Oponente sentado, guarda aberta.',
            'Tração lateral da perna dele para abrir a passagem.',
            ['Pegue a perna de cima dele com a mão dominante',
             'Drag (puxe) lateral cruzando o corpo dele',
             'Joelho seu cai sobre o quadril dele',
             'A outra perna estabelece base larga',
             'Avance para north-south ou side control'],
            'Não controlar a manga — ele escapa pelo quadril.',
            'Pegada na manga oposta evita o recover.',
          ),
        ],
      },
    ],
  },
]

// ─── MARROM — módulos adicionais ───
export const BROWN_EXTRA_MODULES: Module[] = [
  {
    id: 'br-worm-guard', number: '04', label: 'Worm guard + Lapel guards', icon: 'wind',
    color: '#92400E', colorBg: '#FEF3C7',
    description: 'Guardas modernas com lapela — sistema Keenan Cornelius IBJJF.',
    categories: [
      {
        id: 'br-wg1', name: 'Worm guard', icon: 'minus-circle', color: '#92400E', bgColor: '#FEF3C7', textColor: '#78350F',
        techniques: [
          tech('Worm guard básica', 'DLR ou spider estabelecida.',
            'Lapela do oponente enrolada por baixo da própria perna.',
            ['Pegue a lapela oposta dele',
             'Passe por baixo da sua coxa (mesmo lado)',
             'Lapela sai do outro lado e você pega de volta',
             'Mantenha pé apoiado no bíceps livre',
             'Use a tensão da lapela para raspagens ou ataques'],
            'Lapela mal posicionada — escapa.',
            'A trava precisa ser firme antes de qualquer movimento.',
          ),
        ],
      },
    ],
  },
  {
    id: 'br-back-attacks', number: '05', label: 'Sistema completo de costas', icon: 'user',
    color: '#B91C1C', colorBg: '#FEE2E2',
    description: 'Cadeia de ataques pelas costas — mata-leão, bow & arrow, armbar.',
    categories: [
      {
        id: 'br-ba1', name: 'Costas estabelecidas', icon: 'arrow-up', color: '#B91C1C', bgColor: '#FEE2E2', textColor: '#991B1B',
        techniques: [
          tech('Mata-leão (RNC) técnico', 'Costas com 2 ganchos + seat belt.',
            'Estrangulamento clássico, refinado para resistência alta.',
            ['Braço dominante por baixo do queixo do oponente',
             'Mão dominante segura o bíceps oposto',
             'Mão livre vai atrás da cabeça dele',
             'Eleve o cotovelo dominante — não force horizontal',
             'Aperte unindo os cotovelos, peito expandido'],
            'Forçar com força bruta — quanto mais relaxado, mais aperta.',
            'A mecânica está no posicionamento, não na força.',
          ),
          tech('Bow and arrow choke', 'Costas, oponente lateral.',
            'Estrangulamento usando a perna como ângulo.',
            ['Pegue a gola perto do colarinho oposto',
             'Pegue a calça dele do mesmo lado da gola',
             'Solte um dos ganchos e passe a perna por cima',
             'O pé fica no quadril dele empurrando',
             'Puxe gola e calça em direções opostas'],
            'Não soltar o gancho corretamente — perde o ângulo.',
            'Pense no movimento como esticar um arco.',
          ),
        ],
      },
    ],
  },
]

// ─── PRETA — módulos adicionais ───
export const BLACK_EXTRA_MODULES: Module[] = [
  {
    id: 'bl-coaching', number: '03', label: 'Pedagogia + transmissão', icon: 'graduation-cap',
    color: '#0F172A', colorBg: '#F1F5F9',
    description: 'Faixa preta = professor. Aprender a ensinar é parte do currículo.',
    categories: [
      {
        id: 'bl-c1', name: 'Didática', icon: 'lightbulb', color: '#0F172A', bgColor: '#F1F5F9', textColor: '#0F172A',
        techniques: [
          tech('Quebra de técnica em 3 passos', 'Ensinando para grupo misto.',
            'Toda técnica deve ser ensinada em 3 passos simples antes de detalhes.',
            ['Demonstre lento, sem comentar',
             'Repita explicando apenas o passo 1',
             'Repita explicando passos 1+2',
             'Repita explicando 1+2+3 sem detalhes',
             'Só então adicione 1-2 detalhes refinados'],
            'Despejar todos os detalhes na primeira repetição.',
            'O cérebro de iniciante absorve só 3 informações por vez.',
          ),
        ],
      },
    ],
  },
  {
    id: 'bl-competition', number: '04', label: 'Estratégia de competição IBJJF', icon: 'trophy',
    color: '#CA8A04', colorBg: '#FEF9C3',
    description: 'Gestão de pontos, vantagens e ritmo na arena mundial.',
    categories: [
      {
        id: 'bl-cp1', name: 'Game plan', icon: 'list-checks', color: '#CA8A04', bgColor: '#FEF9C3', textColor: '#A16207',
        techniques: [
          tech('Gestão de pontos — vencendo por 2', 'Em vantagem no relógio.',
            'Como manter posição sem cair em punição.',
            ['Mantenha pelo menos meia-guarda — nunca passe a fechada à toa',
             'Evite trocar pegadas — 20s de inatividade não punem se você dominar',
             'Use o tempo de fora do tatame quando possível (lap)',
             'Pegada constante = sem punição',
             'Olhar para o árbitro só causa indecisão dele'],
            'Tentar finalizar à toa — risco de virar a partida.',
            'Faixas pretas vencem pelo controle, não pelo finish.',
          ),
        ],
      },
    ],
  },
]
