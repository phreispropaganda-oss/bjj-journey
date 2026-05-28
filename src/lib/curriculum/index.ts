export type Technique = {
  name: string
  entryPosition: string
  description: string
  steps: string[]
  commonMistake: string
  tip: string
  youtubeQuery: string
}

export type Category = {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  textColor: string
  techniques: Technique[]
}

export type Module = {
  id: string
  number: string
  label: string
  icon: string
  color: string
  colorBg: string
  description: string
  categories: Category[]
}

export type BeltCurriculum = {
  beltId: 'white' | 'blue' | 'purple' | 'brown' | 'black'
  modules: Module[]
}

// ── FAIXA BRANCA ──
const whiteBelt: BeltCurriculum = {
  beltId: 'white',
  modules: [
    {
      id: 'w-posicoes', number: '01', label: 'Posições Básicas', icon: 'layout-kanban',
      color: '#1D9E75', colorBg: '#DCFCE7',
      description: 'Aprenda as posições fundamentais do jiu-jitsu: nomenclatura, como chegar e como controlar.',
      categories: [
        {
          id: 'w-p1', name: 'Posições por cima', icon: 'arrow-up',
          color: '#1D9E75', bgColor: '#DCFCE7', textColor: '#5DCAA5',
          techniques: [
            {
              name: 'Side Control (100 Quilos)',
              entryPosition: 'Você por cima, perpendicular ao adversário deitado. Quadril baixo, ombro no pescoço.',
              description: 'A posição de controle lateral mais comum do jiu-jitsu. Base para a maioria das finalizações de faixa branca.',
              steps: [
                'Posicione-se perpendicular ao adversário deitado',
                'Coloque o ombro no pescoço e o quadril no quadril adversário',
                'Controle com a mão de baixo atrás da cabeça e a de cima no quadril',
                'Mantenha o peso distribuído — não apóie no chão',
              ],
              commonMistake: 'Apoiar no chão com os braços. O peso deve estar no adversário.',
              tip: 'Imagine que você está tentando amassar o adversário no tatame com o peso do corpo.',
              youtubeQuery: 'side control jiu jitsu basics for beginners',
            },
            {
              name: 'Montada',
              entryPosition: 'Você sentado sobre o peito/abdômen do adversário. Joelhos tocam o chão de cada lado.',
              description: '4 pontos na competição. Posição dominante com múltiplas opções de finalização.',
              steps: [
                'Sente sobre o peito do adversário com o quadril baixo',
                'Joelhos no chão dos dois lados do tronco',
                'Pés podem ir embaixo das coxas adversárias (montada baixa) ou estendidos',
                'Mantenha o equilíbrio com movimentos suaves',
              ],
              commonMistake: 'Sentar alto (no abdômen) e não no peito. Quadril deve estar no nível das costelas.',
              tip: 'Quanto mais baixo o quadril, mais estável é a montada.',
              youtubeQuery: 'mount position jiu jitsu control beginners',
            },
            {
              name: 'Pegada de Costas',
              entryPosition: 'Você atrás do adversário com os dois ganchos (pés) nos quadris. Controle do tronco.',
              description: 'A posição mais dominante do jiu-jitsu. Vale 4 pontos.',
              steps: [
                'Posicione-se atrás do adversário sentado ou deitado',
                'Encaixe os ganchos (calcanhar) nos quadris adversários',
                'Controle o tronco com as mãos — uma no peito, outra no ombro',
                'Mantenha os ganchos firmes — essa é sua âncora',
              ],
              commonMistake: 'Cruzar os pés na frente (facilita ser desganchado). Ganchos ficam nos quadris.',
              tip: 'Com os dois ganchos no lugar, o adversário não consegue virar para te enfrentar.',
              youtubeQuery: 'back control jiu jitsu back mount basics',
            },
          ],
        },
        {
          id: 'w-p2', name: 'Posições de guarda', icon: 'shield',
          color: '#2563EB', bgColor: '#EFF6FF', textColor: '#2563EB',
          techniques: [
            {
              name: 'Guarda Fechada',
              entryPosition: 'Você deitado, adversário entre suas pernas. Seus tornozelos cruzados atrás das costas dele.',
              description: 'A posição de guarda mais conhecida do jiu-jitsu. Controle total da distância.',
              steps: [
                'Deite com o adversário entre suas pernas',
                'Cruze os tornozelos atrás das costas adversárias',
                'Controle as mangas ou colarinho com as mãos',
                'Quebre a postura: puxe a cabeça do adversário para baixo com as pernas',
              ],
              commonMistake: 'Manter a guarda muito aberta ou muito alta. Os tornozelos cruzados na região lombar dão o melhor controle.',
              tip: 'Guarda fechada = sua casa. Você está no controle aqui, não o adversário.',
              youtubeQuery: 'closed guard basics jiu jitsu for white belts',
            },
            {
              name: 'Guarda Aberta',
              entryPosition: 'Você deitado, pernas separadas sem cruzar. Pés nos quadris ou joelhos adversários.',
              description: 'Variedade de guardas sem fechar os pés. Cria mobilidade e opções de ataque.',
              steps: [
                'Não cruze os pés — mantenha pernas abertas e ativas',
                'Coloque os pés nos quadris ou joelhos para controle de distância',
                'Use as mãos para controlar as mangas adversárias',
                'Movimente o quadril constantemente — guarda estática é guarda morta',
              ],
              commonMistake: 'Ficar parado com a guarda aberta. Quadril em movimento constante.',
              tip: 'Guarda aberta é mais dinâmica que a fechada — exige mais mobilidade de quadril.',
              youtubeQuery: 'open guard jiu jitsu basics beginners',
            },
          ],
        },
        {
          id: 'w-p3', name: 'Regras básicas de etiqueta', icon: 'star',
          color: '#B45309', bgColor: '#FFFBEB', textColor: '#B45309',
          techniques: [
            {
              name: 'Hierarquia e respeito no tatame',
              entryPosition: 'No início e fim de cada treino. Antes do roll com cada parceiro.',
              description: 'As regras de comportamento que definem o ambiente de treinamento do jiu-jitsu.',
              steps: [
                'Cumprimente o professor e os mais graduados ao entrar no tatame',
                'Lave o kimono regularmente — higiene é respeito',
                'Bata quando estiver em dificuldade — não é fraqueza, é inteligência',
                'Sempre aperte a mão (ou pé) do parceiro ao começar e terminar um roll',
              ],
              commonMistake: 'Ego no tatame. Resistir a bater por orgulho resulta em lesões.',
              tip: 'Bater rápido e voltar ao treino é muito mais produtivo do que se machucar.',
              youtubeQuery: 'jiu jitsu etiquette beginner guide',
            },
            {
              name: 'Como bater corretamente',
              entryPosition: 'Sempre que sentir pressão em uma articulação ou estrangulamento efetivo.',
              description: 'Bater é a ferramenta de segurança mais importante do jiu-jitsu.',
              steps: [
                'Bata com a mão aberta no tatame, no parceiro ou em você mesmo',
                '3 batidas rápidas = parar imediatamente',
                'Se não conseguir bater, diga "tap" em voz alta',
                'Bata cedo — antes de sentir dor, não depois',
              ],
              commonMistake: 'Bater tarde por vergonha ou orgulho. Lesões tiram meses de treino.',
              tip: 'No treino, bater e voltar a rolar é a mentalidade certa. Salve as energias para o longo prazo.',
              youtubeQuery: 'how to tap out jiu jitsu safety',
            },
          ],
        },
      ],
    },
    {
      id: 'w-escape', number: '02', label: 'Escapes Fundamentais', icon: 'arrow-left',
      color: '#E24B4A', colorBg: '#FEF2F2',
      description: 'Escapar de posições desfavoráveis é a habilidade mais importante da faixa branca.',
      categories: [
        {
          id: 'w-e1', name: 'Escapes do Side Control', icon: 'arrows-move',
          color: '#E24B4A', bgColor: '#FEF2F2', textColor: '#E24B4A',
          techniques: [
            {
              name: 'Shrimp Escape (Camarão)',
              entryPosition: 'Você embaixo no 100 quilos. Adversário com peso sobre você. Quadril precisa criar espaço.',
              description: 'O movimento mais importante do jiu-jitsu defensivo. Shrimping cria espaço para recuperar guarda.',
              steps: [
                'Com as mãos, empurre o quadril adversário para criar um centímetro de espaço',
                'Gire para o lado encurtando o lado que está sendo controlado',
                'Caminhe os quadris para longe — "camarão" (shrimp)',
                'Coloque o joelho como escudo entre você e o adversário',
                'Continue o movimento até recuperar a guarda',
              ],
              commonMistake: 'Tentar escapar sem primeiro criar espaço. Espaço vem primeiro, depois movimento.',
              tip: 'O movimento de shrimp deve ser explosivo e contínuo — parar no meio facilita ser recontrolado.',
              youtubeQuery: 'shrimp escape jiu jitsu beginners side control',
            },
            {
              name: 'Ponte e Rolar (Bridge & Roll)',
              entryPosition: 'Você embaixo no 100 quilos ou montada. Adversário postado sobre você.',
              description: 'Escape por explosão do quadril para cima (ponte) criando desequilíbrio e rolando.',
              steps: [
                'Coloque os pés no chão próximos ao quadril com joelhos dobrados',
                'Controle o braço ou cotovelo adversário do lado para onde vai rolar',
                'Exploda o quadril para CIMA e para o LADO simultaneamente (bridge)',
                'Role o adversário usando o desequilíbrio criado',
                'Termine por cima ou recupere a guarda',
              ],
              commonMistake: 'Fazer a ponte para cima sem ir para o lado. Bridge + roll = dois movimentos juntos.',
              tip: 'A ponte precisa ser explosiva. Um movimento lento não cria desequilíbrio suficiente.',
              youtubeQuery: 'bridge roll escape jiu jitsu beginners',
            },
          ],
        },
        {
          id: 'w-e2', name: 'Escape da Montada', icon: 'arrow-down',
          color: '#7C3AED', bgColor: '#EEF2FF', textColor: '#7C3AED',
          techniques: [
            {
              name: 'Upa (Ponte da Montada)',
              entryPosition: 'Você embaixo na montada. Adversário sentado no seu peito. Pés no chão.',
              description: 'O escape principal da montada para faixas iniciais. A ponte (upa) desequilibra o adversário.',
              steps: [
                'Coloque os pés no chão, perto dos glúteos',
                'Controle o braço/pulso adversário do lado para onde vai rolar',
                'Exploda o quadril para cima e para o lado (ponte/upa)',
                'Use o desequilíbrio para rolar o adversário',
                'Mantenha o controle ao chegar ao topo',
              ],
              commonMistake: 'Ponte para cima sem travar o braço adversário. Sem travar, ele apenas se reequilibra.',
              tip: 'Upa + travar o braço = combo que poucas pessoas conseguem defender quando executado explosivo.',
              youtubeQuery: 'upa escape mount jiu jitsu beginners',
            },
            {
              name: 'Elbow-Knee Escape',
              entryPosition: 'Você embaixo na montada. Adversário montado. Você vai criar espaço com cotovelo e joelho.',
              description: 'Escape técnico usando cotovelo e joelho para criar espaço e recuperar a guarda.',
              steps: [
                'Com o cotovelo, empurre o joelho adversário criando espaço',
                'Imediatamente coloque seu joelho no espaço criado',
                'Continue o movimento de shrimp para o mesmo lado',
                'Passe o pé pelo quadril adversário',
                'Termine em guarda fechada ou aberta',
              ],
              commonMistake: 'Criar pouco espaço com o cotovelo. O cotovelo precisa criar espaço suficiente para o joelho entrar.',
              tip: 'Elbow-knee é mais técnico que o upa — funciona mesmo quando o adversário está pesado.',
              youtubeQuery: 'elbow knee escape mount jiu jitsu',
            },
          ],
        },
      ],
    },
    {
      id: 'w-finalizacoes', number: '03', label: 'Primeiras Finalizações', icon: 'circle-x',
      color: '#BA7517', colorBg: '#FFFBEB',
      description: 'As finalizações mais seguras e eficazes para começar a desenvolver seu ataque.',
      categories: [
        {
          id: 'w-f1', name: 'Chaves de braço básicas', icon: 'arm',
          color: '#BA7517', bgColor: '#FFFBEB', textColor: '#BA7517',
          techniques: [
            {
              name: 'Americana da Montada',
              entryPosition: 'Você montado. Adversário com braço ao lado do tronco ou tentando fazer base.',
              description: 'A primeira finalização que todo praticante aprende. Chave de ombro com rotação interna.',
              steps: [
                'Da montada, empurre um braço acima da cabeça do adversário em 90°',
                'Seu peito pressiona a cabeça — isso trava o cotovelo no chão',
                'Passe o braço livre por baixo do cotovelo adversário',
                'Pegue seu próprio pulso (grip figure-four)',
                'Eleve o cotovelo e mova o pulso em arco',
              ],
              commonMistake: 'Deixar o cotovelo sair do chão. O peito na cabeça é o que mantém o cotovelo colado.',
              tip: 'Se bem posicionada, a americana finaliza com mínima força — é pura alavanca.',
              youtubeQuery: 'americana mount submission jiu jitsu beginners',
            },
            {
              name: 'Americana do Side Control',
              entryPosition: 'Você no 100 quilos. Braço próximo do adversário perto do chão.',
              description: 'A versão do 100 quilos da americana. Aproveita o peso natural da posição.',
              steps: [
                'No 100 quilos, empurre o braço próximo acima da cabeça adversária',
                'Pressione o peito na cabeça para travar o cotovelo',
                'Passe o braço livre por baixo do cotovelo',
                'Pegue o pulso (figure-four)',
                'Eleve o cotovelo e mova o pulso em arco',
              ],
              commonMistake: 'Deixar o adversário sentar ou virar antes de aplicar. Mantenha o peso no lugar.',
              tip: 'Funciona junto com a ameaça de guilhotina — o adversário não sabe o que defender.',
              youtubeQuery: 'americana side control jiu jitsu beginners',
            },
          ],
        },
        {
          id: 'w-f2', name: 'Estrangulamentos básicos', icon: 'circle-x',
          color: '#E24B4A', bgColor: '#FEF2F2', textColor: '#E24B4A',
          techniques: [
            {
              name: 'Mata Leão Iniciante',
              entryPosition: 'Você nas costas do adversário. Um braço em volta do pescoço. Ganchos nos quadris.',
              description: 'O estrangulamento mais icônico. Aprenda a posição correta do antebraço antes de qualquer outra coisa.',
              steps: [
                'Com os ganchos estabelecidos, passe um braço em volta do pescoço',
                'Posicione o ANTEBRAÇO na carótida lateral (não na traqueia)',
                'A outra mão vai no bíceps do braço de ataque',
                'Traga o outro braço por trás da cabeça',
                'Aperte trazendo o cotovelo para dentro',
              ],
              commonMistake: 'Apertar na traqueia. A carótida é o alvo — mais rápido e mais eficiente.',
              tip: 'Se o adversário bater, é porque a carótida está correta. Traqueia dói mas demora.',
              youtubeQuery: 'rear naked choke basics jiu jitsu beginners',
            },
            {
              name: 'Guilhotina de frente',
              entryPosition: 'Adversário abaixou a cabeça. Você de frente, envolve o pescoço com o braço.',
              description: 'Estrangulamento de frente quando o adversário abaixa a cabeça tentando passar a guarda.',
              steps: [
                'Quando o adversário abaixa a cabeça, envolva o pescoço imediatamente',
                'Coloque o antebraço na traqueia/carótida frontal',
                'A outra mão segura o pulso',
                'Feche a guarda se possível para controle',
                'Puxe o pescoço para cima e eleve o quadril',
              ],
              commonMistake: 'Antebraço atrás do pescoço. Precisa estar NA FRENTE da garganta.',
              tip: 'Guilhotina é timing — não espere ele terminar de abaixar, ataque durante o movimento.',
              youtubeQuery: 'guillotine choke basics jiu jitsu beginners',
            },
          ],
        },
      ],
    },
  ],
}

// ── FAIXA AZUL ──
const blueBelt: BeltCurriculum = {
  beltId: 'blue',
  modules: [
    {
      id: 'b-passagens', number: '01', label: 'Passagens de Guarda', icon: 'arrow-right',
      color: '#2563EB', colorBg: '#EFF6FF',
      description: 'O jogador que passa a guarda domina o combate. Aprenda as passagens essenciais da azul.',
      categories: [
        {
          id: 'b-p1', name: 'Passagens clássicas', icon: 'arrow-right',
          color: '#2563EB', bgColor: '#EFF6FF', textColor: '#2563EB',
          techniques: [
            {
              name: 'Torreando (Bullfighter)',
              entryPosition: 'Adversário em guarda aberta. Você em pé ou agachado, controla os dois joelhos.',
              description: 'Passagem circular ao redor das pernas adversárias. A mais versátil do jiu-jitsu.',
              steps: [
                'Controle os dois joelhos/coxas do adversário com as mãos',
                'Mova lateralmente em arco ao redor das pernas — sem pular por cima',
                'Empurre as pernas para longe enquanto avança o quadril',
                'Contorne completamente e estabeleça o 100 quilos',
                'Controle cabeça e quadril ao terminar',
              ],
              commonMistake: 'Passar por CIMA das pernas. O torreando é sempre ao REDOR, pelo lado.',
              tip: 'Combine o torreando com ameaça de stack pass para criar opções e confundir o adversário.',
              youtubeQuery: 'toreando bullfighter pass jiu jitsu',
            },
            {
              name: 'Stack Pass (Pilha)',
              entryPosition: 'Adversário em guarda aberta. Você controla as mangas/pernas e vai dobrar o adversário.',
              description: 'Passagem de pressão dobrando o adversário sobre si mesmo para remover a alavancagem das pernas.',
              steps: [
                'Controle as duas mangas ou pernas do adversário firmemente',
                'Avance agressivamente empurrando as pernas sobre o corpo',
                'Dobre-o sobre si mesmo (stacking) — joelhos vão ao peito',
                'Com ele dobrado, as pernas perdem alavancagem',
                'Passe para o lado e estabeleça o controle lateral',
              ],
              commonMistake: 'Passar por CIMA após o stack. Após o stack, sempre vá para o LADO.',
              tip: 'O stack pass é mais eficaz quando você cria pressão antes de dobrar.',
              youtubeQuery: 'stack pass guard jiu jitsu blue belt',
            },
            {
              name: 'Knee Slide Básico',
              entryPosition: 'Adversário em guarda fechada ou meia guarda. Você por cima com ombro no quadril.',
              description: 'O corte de joelho é uma das passagens mais eficientes e versáteis do jiu-jitsu.',
              steps: [
                'Abra a guarda do adversário e controle um joelho',
                'Pressione o ombro no quadril adversário',
                'Deslize o joelho em diagonal entre as pernas',
                'Pressione e complete o corte liberando a perna',
                'Estabeleça o 100 quilos',
              ],
              commonMistake: 'Levantar o quadril ao cortar. A pressão do ombro no quadril é o que permite o corte.',
              tip: 'Ombro no quadril é a chave. Sem pressão, o adversário recompõe guarda.',
              youtubeQuery: 'knee slide pass jiu jitsu fundamentals',
            },
          ],
        },
        {
          id: 'b-p2', name: 'Passagens avançadas', icon: 'bolt',
          color: '#1D4ED8', bgColor: '#DBEAFE', textColor: '#1D4ED8',
          techniques: [
            {
              name: 'Leg Drag',
              entryPosition: 'Adversário em guarda aberta. Você controla uma ou duas pernas com as mãos.',
              description: 'Passagem por arraste que desposiciona completamente as pernas adversárias.',
              steps: [
                'Controle a perna de guarda com as duas mãos',
                'Arraste as pernas agressivamente para O SEU LADO',
                'Simultâneo ao arraste: avance o quadril para o lado OPOSTO',
                'Pressione as pernas arrastadas no chão com o quadril',
                'Assuma controle lateral rapidamente',
              ],
              commonMistake: 'Arrastar sem avançar o quadril no mesmo momento. São movimentos simultâneos.',
              tip: 'A chave é a rapidez do avanço do quadril — cada segundo que demora dá tempo ao adversário.',
              youtubeQuery: 'leg drag pass jiu jitsu',
            },
            {
              name: 'X-Pass',
              entryPosition: 'Adversário com guarda aberta, pés no chão ou nas suas coxas. Você em pé ou agachado.',
              description: 'Passagem em X — você passa para o lado enquanto empurra uma perna e pisa na outra.',
              steps: [
                'Com uma mão, empurre um joelho para baixo',
                'Com o pé, pise levemente no outro joelho do adversário (controle)',
                'Passe para o lado do joelho empurrado',
                'Avance para o 100 quilos enquanto mantém controle',
                'Estabeleça antes de soltar os controles',
              ],
              commonMistake: 'Empurrar o joelho sem cruzar simultaneamente. O X-pass é um movimento cruzado.',
              tip: 'Funciona excelente como segundo ataque após o torreando ser defendido.',
              youtubeQuery: 'x pass jiu jitsu blue belt',
            },
          ],
        },
      ],
    },
    {
      id: 'b-guarda', number: '02', label: 'Ataques da Guarda Fechada', icon: 'shield',
      color: '#7C3AED', colorBg: '#EEF2FF',
      description: 'Na azul, a guarda fechada é arma de ataque. Domine os ataques clássicos.',
      categories: [
        {
          id: 'b-g1', name: 'Chaves de braço', icon: 'arm',
          color: '#7C3AED', bgColor: '#EEF2FF', textColor: '#7C3AED',
          techniques: [
            {
              name: 'Armlock da Guarda',
              entryPosition: 'Adversário na sua guarda fechada. Controle o pulso do braço-alvo com AMBAS as mãos.',
              description: 'A extensão do cotovelo da guarda fechada. O ângulo criado pelas pernas é a chave.',
              steps: [
                'Controle o pulso do braço-alvo com as duas mãos',
                'Coloque a perna do mesmo lado no quadril adversário',
                'Gire: passe a outra perna por cima da cabeça',
                'Deite de lado com o cotovelo adversário no seu quadril',
                'Eleve o quadril gradualmente para a extensão',
              ],
              commonMistake: 'Puxar o braço sem elevar o quadril. O quadril é a alavanca principal.',
              tip: 'Polegar do adversário apontando para cima maximiza a pressão do armlock.',
              youtubeQuery: 'armlock from closed guard jiu jitsu',
            },
            {
              name: 'Americana da Guarda',
              entryPosition: 'Adversário postado na guarda. Braço próximo ao chão. Você empurra o punho acima da cabeça.',
              description: 'A americana aplicada de baixo quando o adversário posta o braço no chão.',
              steps: [
                'Quando o adversário posta o braço, empurre o punho acima da cabeça em 90°',
                'Passe o outro braço por baixo do cotovelo',
                'Forme o figure-four grip',
                'Trave com o peito na cabeça adversária',
                'Eleve o cotovelo e mova o pulso em arco',
              ],
              commonMistake: 'Cotovelo sair do chão. Pressione a cabeça com o peito para travar.',
              tip: 'Funciona muito bem após a ameaça de armlock — quando ele se defende, americana.',
              youtubeQuery: 'americana from guard jiu jitsu',
            },
          ],
        },
        {
          id: 'b-g2', name: 'Finalizações de pernas', icon: 'triangle',
          color: '#059669', bgColor: '#F0FDF4', textColor: '#059669',
          techniques: [
            {
              name: 'Triângulo da Guarda',
              entryPosition: 'Adversário na guarda. Abra o ângulo 45°. Um braço dentro, um fora.',
              description: 'O estrangulamento com pernas mais poderoso do jiu-jitsu.',
              steps: [
                'Abra o ângulo empurrando o quadril 45° para o lado',
                'Empurre um braço adversário para fora do corpo',
                'Passe a perna pelo pescoço (cruzando pelo ombro)',
                'Cruze as pernas — tornozelo atrás do joelho oposto',
                'Puxe a cabeça e aperte as coxas',
              ],
              commonMistake: 'Aplicar sem o ângulo de 45°. Sem ângulo a coxa não alcança a carótida.',
              tip: 'Um braço dentro, um fora — esse é o setup. Sem isso não há triângulo.',
              youtubeQuery: 'triangle choke from guard jiu jitsu blue belt',
            },
            {
              name: 'Omoplata',
              entryPosition: 'Adversário na guarda. Abra ângulo. Passe a perna POR CIMA do ombro (não do pescoço).',
              description: 'Chave de ombro com rotação aplicada pelas pernas.',
              steps: [
                'Abra forte o ângulo para o lado',
                'Passe a perna POR CIMA do ombro adversário — não do pescoço',
                'Cruze os tornozelos para não perder a posição',
                'Sente para frente — quadril pressiona o ombro',
                'Controle o quadril com as mãos',
              ],
              commonMistake: 'Perna no pescoço em vez do ombro. Correto = paralelo ao ombro.',
              tip: 'Do ângulo da guarda, a transição para omoplata é quase automática.',
              youtubeQuery: 'omoplata from guard jiu jitsu',
            },
          ],
        },
      ],
    },
    {
      id: 'b-cem', number: '03', label: '100 Quilos — Controle', icon: 'layout-kanban',
      color: '#D85A30', colorBg: '#FFF5EE',
      description: 'Domine o 100 quilos: a posição de controle lateral mais pontuada do jiu-jitsu.',
      categories: [
        {
          id: 'b-c1', name: 'Controle e pressão', icon: 'arrows-move',
          color: '#D85A30', bgColor: '#FFF5EE', textColor: '#D85A30',
          techniques: [
            {
              name: 'Controle do 100 Quilos',
              entryPosition: 'Perpendicular ao adversário deitado. Ombro no pescoço, quadril no quadril adversário.',
              description: 'A fundação do jogo por cima. Controle eficaz impede escapes e cria oportunidades.',
              steps: [
                'Posicione-se perpendicular com ombro no pescoço adversário',
                'Mão de baixo: atrás da cabeça adversária',
                'Mão de cima: controla o quadril ou cinto',
                'Quadril baixo — não fique ereto',
                'Pressione com o peso do corpo, não com os braços',
              ],
              commonMistake: 'Apoiar nas mãos perdendo o peso sobre o adversário. Peso no adversário, não no chão.',
              tip: 'Varie os controles para frustrar os escapes: muda o ângulo de pressão frequentemente.',
              youtubeQuery: 'side control fundamentals jiu jitsu blue belt',
            },
            {
              name: 'Joelho na Barriga Básico',
              entryPosition: 'Do 100 quilos. Controle do pulso adversário. Seu joelho sobe para o abdômen.',
              description: 'Progressão do 100 quilos que vale 2 pontos e amplifica as ameaças.',
              steps: [
                'Do 100 quilos, controle o pulso adversário com uma mão',
                'Com a outra, controle o cinto ou colarinho',
                'Suba o joelho de baixo para o ABDÔMEN adversário',
                'O pé de apoio fica estendido atrás como âncora',
                'Permaneça equilibrado — o peso já incomoda',
              ],
              commonMistake: 'Colocar o joelho na costela em vez do abdômen. Abdômen = mais pressão e controle.',
              tip: 'Controle o pulso primeiro. Sem isso, o adversário empurra o joelho imediatamente.',
              youtubeQuery: 'knee on belly basics jiu jitsu',
            },
          ],
        },
        {
          id: 'b-c2', name: 'Finalizações do 100 quilos', icon: 'bolt',
          color: '#B45309', bgColor: '#FFFBEB', textColor: '#B45309',
          techniques: [
            {
              name: 'Armlock do 100 Quilos',
              entryPosition: 'Do 100 quilos. Braço distante do adversário estendido tentando criar espaço.',
              description: 'Extensão do cotovelo usando o quadril como fulcro no braço distante.',
              steps: [
                'Identifique o braço distante estendido',
                'Controle o pulso com ambas as mãos',
                'Gire e posicione o QUADRIL sobre o cotovelo adversário',
                'Segure o pulso contra o peito',
                'Eleve o quadril para a extensão',
              ],
              commonMistake: 'Usar força dos braços. A extensão vem da elevação do QUADRIL.',
              tip: 'Funciona quando o adversário usa o braço distante para se sentar ou puxar guarda.',
              youtubeQuery: 'armlock side control jiu jitsu blue belt',
            },
            {
              name: 'Americana do 100 Quilos',
              entryPosition: 'Do 100 quilos. Braço próximo empurrado acima da cabeça em 90°.',
              description: 'A americana mais eficiente — o peso corporal torna difícil resistir.',
              steps: [
                'Empurre o braço próximo acima da cabeça em 90°',
                'SEU PEITO pressiona a cabeça travando o cotovelo',
                'Passe o braço livre por baixo do cotovelo',
                'Pegue o pulso (figure-four)',
                'Eleve cotovelo e mova pulso em arco',
              ],
              commonMistake: 'Não pressionar o peito na cabeça. É o que mantém o cotovelo no chão.',
              tip: 'Com o peito na cabeça, a americana finaliza com força mínima — é pura geometria.',
              youtubeQuery: 'americana side control jiu jitsu',
            },
          ],
        },
      ],
    },
  ],
}

// ── FAIXA MARROM ──
const brownBelt: BeltCurriculum = {
  beltId: 'brown',
  modules: [
    {
      id: 'br-leg', number: '01', label: 'Leg Locks Legais', icon: 'arrow-down',
      color: '#92400E', colorBg: '#FEF3C7',
      description: 'Na faixa marrom, leg locks são liberados. Aprenda o sistema de controle e finalizações de pernas.',
      categories: [
        {
          id: 'br-l1', name: 'Controles de perna', icon: 'arrows-move',
          color: '#92400E', bgColor: '#FEF3C7', textColor: '#92400E',
          techniques: [
            {
              name: 'Ashi Garami (posição de controle)',
              entryPosition: 'Você no chão. Uma perna do adversário entre as suas. Seu pé no quadril, sola atrás do joelho.',
              description: 'O controle de perna fundamental. Todas as finalizações de leg lock saem do ashi garami.',
              steps: [
                'Capture uma perna adversária entre as suas pernas',
                'Posicione o pé no quadril adversário (pé de fora)',
                'Sola do outro pé vai atrás do joelho (pé de dentro)',
                'Controle o tornozelo com as mãos',
                'Mantenha a posição — controle primeiro, finalização depois',
              ],
              commonMistake: 'Tentar finalizar sem primeiro estabilizar o controle. Ashi garami estabelecido antes de atacar.',
              tip: 'O controle do tornozelo é o que conecta você ao adversário — nunca solte.',
              youtubeQuery: 'ashi garami leg entanglement jiu jitsu brown belt',
            },
            {
              name: 'Outside Ashi (Ashi externo)',
              entryPosition: 'Você com a perna adversária capturada pelo lado de fora (tornozelo do seu lado de fora).',
              description: 'Variação do ashi garami com controle externo. Acesso a heel hook externo.',
              steps: [
                'Capture a perna pelo lado externo',
                'Seu pé de fora vai no quadril, pé de dentro cruza atrás do joelho',
                'Controle o tornozelo — polegar para cima',
                'Mantenha o alinhamento: seu quadril deve estar perpendicular à perna adversária',
                'Posição estável antes de qualquer ataque',
              ],
              commonMistake: 'Quadril não alinhado com a perna adversária. Alinhamento correto é tudo no leg lock.',
              tip: 'Outside ashi é a posição de controle mais segura para aprender leg locks.',
              youtubeQuery: 'outside ashi garami jiu jitsu brown belt',
            },
          ],
        },
        {
          id: 'br-l2', name: 'Finalizações de perna', icon: 'circle-x',
          color: '#7C2D12', bgColor: '#FFF7ED', textColor: '#7C2D12',
          techniques: [
            {
              name: 'Kneebar',
              entryPosition: 'Do ashi garami. Seu antebraço posicionado ATRÁS do joelho adversário como fulcro.',
              description: 'Chave de joelho que força extensão forçada da articulação.',
              steps: [
                'Do ashi garami, posicione o antebraço ATRÁS do joelho adversário',
                'O cotovelo é o fulcro da alavanca',
                'Com as mãos, controle acima e abaixo do joelho',
                'Estenda as suas pernas criando extensão no joelho adversário',
                'Aplique pressão gradual e controlada',
              ],
              commonMistake: 'Aplicar com força bruta. Kneebar é delicado — pressão gradual, não explosiva.',
              tip: 'Comunique sempre ao parceiro em treino antes de aplicar. A articulação do joelho é sensível.',
              youtubeQuery: 'kneebar submission jiu jitsu brown belt',
            },
            {
              name: 'Straight Ankle Lock',
              entryPosition: 'Você com o tornozelo adversário capturado. Seu antebraço na frente do tornozelo como guilhotina.',
              description: 'O lock de tornozelo básico — sem rotação, apenas extensão direta do tornozelo.',
              steps: [
                'Capture o tornozelo adversário entre seu braço e tronco',
                'Posicione o antebraço NA FRENTE do tornozelo (guilhotina)',
                'Abraçe o tornozelo apoiando a mão no próprio bíceps',
                'Deite para o lado e comprima — o tornozelo hiperextende',
                'Aplique pressão gradual',
              ],
              commonMistake: 'Tentar puxar o pé em rotação — isso é heel hook e tem regras específicas. Straight ankle é extensão.',
              tip: 'Straight ankle lock é permitido da faixa azul em competição. Mas domine o controle antes.',
              youtubeQuery: 'straight ankle lock jiu jitsu fundamentals',
            },
          ],
        },
      ],
    },
    {
      id: 'br-dlr', number: '02', label: 'Guarda De La Riva', icon: 'wave-sine',
      color: '#0891B2', colorBg: '#ECFEFF',
      description: 'A guarda De La Riva é a porta de entrada para o jogo moderno de guarda. Domine o gancho.',
      categories: [
        {
          id: 'br-d1', name: 'Fundamentos do DLR', icon: 'anchor',
          color: '#0891B2', bgColor: '#ECFEFF', textColor: '#0891B2',
          techniques: [
            {
              name: 'O Gancho De La Riva',
              entryPosition: 'Adversário em pé. Seu pé envolve a perna adversária por dentro do joelho.',
              description: 'O gancho De La Riva envolve a perna adversária por dentro criando controle assimétrico poderoso.',
              steps: [
                'Posicione-se de lado ao adversário em pé',
                'Envolva a perna adversária com seu pé por dentro — pé envolve a perna por dentro do joelho',
                'Controle a manga e o tornozelo adversários',
                'O outro pé pode ir no quadril para controle adicional',
                'Movimente o quadril para manter o controle dinâmico',
              ],
              commonMistake: 'Gancho muito baixo (no tornozelo). O gancho deve ser na panturrilha ou mais alto para ter controle.',
              tip: 'DLR + controle de manga = base de todo o jogo moderno de guarda aberta.',
              youtubeQuery: 'de la riva guard basics fundamentals jiu jitsu',
            },
            {
              name: 'Sweep do DLR',
              entryPosition: 'DLR estabelecido. Controle de manga e tornozelo. Adversário com peso levemente para frente.',
              description: 'A raspagem clássica do De La Riva usando o gancho como alavanca.',
              steps: [
                'Do DLR, puxe a manga enquanto empurra a perna com o gancho',
                'Crie rotação no adversário',
                'Coloque o outro pé no quadril para amplificar a alavanca',
                'Vire o quadril e execute a raspagem',
                'Termine por cima em passagem ou 100 quilos',
              ],
              commonMistake: 'Tentar raspar sem criar a rotação primeiro. O sweep do DLR é rotatório.',
              tip: 'De La Riva, aranha e omoplata formam uma família. Quando uma não funciona, transicione.',
              youtubeQuery: 'de la riva sweep jiu jitsu brown belt',
            },
          ],
        },
        {
          id: 'br-d2', name: 'Transições do DLR', icon: 'refresh',
          color: '#0E7490', bgColor: '#F0F9FF', textColor: '#0E7490',
          techniques: [
            {
              name: 'DLR para Omoplata',
              entryPosition: 'DLR com controle de manga. Você vai girar o quadril para passar a perna pelo ombro.',
              description: 'A transição mais natural do DLR. A rotação criada pelo gancho alimenta a omoplata.',
              steps: [
                'Do DLR, puxe a manga e empurre a perna com o gancho criando rotação',
                'Gire o seu quadril para o lado',
                'Passe a perna por cima do ombro adversário',
                'Cruze os tornozelos para segurar',
                'Sente para frente completando a omoplata',
              ],
              commonMistake: 'Tentar a omoplata sem a rotação do DLR. Use o momentum do gancho para o giro.',
              tip: 'A rotação criada pelo DLR é o que torna a omoplata fluida — não é força.',
              youtubeQuery: 'de la riva to omoplata jiu jitsu',
            },
            {
              name: 'DLR para Berimbolo (intro)',
              entryPosition: 'DLR com controle de manga. Adversário tenta passar. Você vai rolar para criar o ângulo.',
              description: 'Introdução ao berimbolo — o movimento que revolucionou o jiu-jitsu moderno.',
              steps: [
                'Do DLR, quando o adversário tenta passar, role para dentro (invertido)',
                'Mantenha o gancho DLR durante o roll',
                'Enquanto rola, posicione as pernas para trás do adversário',
                'Complete o roll e termine nas costas adversárias',
                'Estabeleça os ganchos',
              ],
              commonMistake: 'Rolar sem manter o gancho. O gancho DLR é o eixo de rotação do berimbolo.',
              tip: 'O berimbolo é complexo — drill o roll isolado antes de tentar no sparring.',
              youtubeQuery: 'berimbolo introduction jiu jitsu de la riva',
            },
          ],
        },
      ],
    },
    {
      id: 'br-refinamento', number: '03', label: 'Sequências de Ataque', icon: 'route',
      color: '#16A34A', colorBg: '#F0FDF4',
      description: 'Na marrom, as técnicas se conectam em sequências fluidas. Aprenda a encadear ataques.',
      categories: [
        {
          id: 'br-r1', name: 'Sequências fundamentais', icon: 'arrows-sort',
          color: '#16A34A', bgColor: '#F0FDF4', textColor: '#16A34A',
          techniques: [
            {
              name: 'Armlock → Triângulo → Omoplata',
              entryPosition: 'Você na guarda fechada. Adversário postado. Esta é a trindade da guarda.',
              description: 'A sequência mais clássica do jiu-jitsu. Cada defesa cria a próxima oportunidade.',
              steps: [
                'Tente o armlock — quando ele defende puxando o braço...',
                'Encadeie para o triângulo (braço cruzado o corpo = triângulo)',
                'Se o triângulo não fechar completamente...',
                'Vire para a omoplata com a perna que estava no triângulo',
                'Cada ataque abre o próximo — não abandone a sequência',
              ],
              commonMistake: 'Abandonar o primeiro ataque muito cedo. A sequência funciona pela persistência.',
              tip: 'Treinar especificamente: armlock 3x, triangle 3x, omoplata 3x em sequência sem parar.',
              youtubeQuery: 'armlock triangle omoplata sequence closed guard',
            },
            {
              name: 'Kimura → Guilhotina → Raspagem',
              entryPosition: 'Você na guarda fechada ou meia guarda. Adversário tentando passar.',
              description: 'Sequência defensivo-ofensiva: o adversário tenta passar, você converte em ataque.',
              steps: [
                'Quando ele tenta passar, busque o Kimura no braço que vem',
                'Se ele defender o Kimura travando o braço...',
                'Transite para guilhotina (a cabeça abaixou para defender o Kimura)',
                'Se a guilhotina não fechar...',
                'Volte para o Kimura e use como alavanca para a raspagem hip bump',
              ],
              commonMistake: 'Tentar uma técnica muitas vezes sem variar. A sequência é o que cria o dilema.',
              tip: 'Kimura trap: o Kimura no place cria ameaças em múltiplas direções.',
              youtubeQuery: 'kimura guillotine sweep sequence jiu jitsu',
            },
          ],
        },
      ],
    },
  ],
}

// ── FAIXA PRETA ──
const blackBelt: BeltCurriculum = {
  beltId: 'black',
  modules: [
    {
      id: 'bl-lls', number: '01', label: 'Sistema de Leg Locks', icon: 'arrow-down',
      color: '#FF6B2B', colorBg: '#FFF0E8',
      description: 'O sistema completo de leg locks moderno. Heel hooks, controles avançados e defesas.',
      categories: [
        {
          id: 'bl-l1', name: 'Heel Hooks', icon: 'circle-x',
          color: '#FF6B2B', bgColor: '#FFF0E8', textColor: '#FF6B2B',
          techniques: [
            {
              name: 'Inside Heel Hook',
              entryPosition: 'Inside ashi garami (posição de controle interna). Controle firme do tornozelo.',
              description: 'O heel hook mais poderoso do jiu-jitsu. Rotação interna do tornozelo atacando o ligamento colateral.',
              steps: [
                'Estabeleça o inside ashi garami com controle firme',
                'Controle o tornozelo com a mão mais próxima (dedos apontando para cima)',
                'A outra mão agarra o calcanhar (heel hook)',
                'Gire o tronco e a cabeça para a direção do heel hook',
                'A rotação do tronco cria a torsão no joelho — aplique gradual',
              ],
              commonMistake: 'Aplicar explosivamente. Heel hook é sutil e rápido — dano ocorre antes da dor.',
              tip: 'Proibido até faixa marrom na maioria das organizações. Drille o controle antes da finalização.',
              youtubeQuery: 'inside heel hook jiu jitsu black belt',
            },
            {
              name: 'Outside Heel Hook',
              entryPosition: 'Outside ashi garami. Perna adversária capturada pelo lado externo.',
              description: 'Heel hook externo — ataca a mesma estrutura do joelho por ângulo diferente.',
              steps: [
                'Do outside ashi, controle firme do tornozelo',
                'Posicione a mão no calcanhar com o polegar para baixo (grip oposto ao inside)',
                'Gire o tronco na direção oposta ao inside heel hook',
                'Pressão gradual — o ligamento lateral é o alvo',
                'Libere imediatamente ao primeiro sinal de tap',
              ],
              commonMistake: 'Confundir direção de rotação com inside heel hook. São direções opostas.',
              tip: 'Outside heel hook tem uma janela maior para aplicar — mas ainda requer controle preciso.',
              youtubeQuery: 'outside heel hook jiu jitsu advanced',
            },
          ],
        },
      ],
    },
    {
      id: 'bl-sistema', number: '02', label: 'Jogo Completo Integrado', icon: 'infinity',
      color: '#1A1A1A', colorBg: '#F9FAFB',
      description: 'Na preta, todos os sistemas se integram. O jogo torna-se uma linguagem fluente.',
      categories: [
        {
          id: 'bl-s1', name: 'Sistemas integrados', icon: 'route',
          color: '#1A1A1A', bgColor: '#F9FAFB', textColor: '#1A1A1A',
          techniques: [
            {
              name: 'Half Guard System',
              entryPosition: 'Meia guarda com underhook. Todos os ataques, escapes e transições integrados.',
              description: 'Na faixa preta, a meia guarda é um sistema completo — não apenas uma posição.',
              steps: [
                'De baixo: underhook → dog fight → back take ou sweep',
                'De cima: knee slice → smash pass → leg drag em sequência',
                'Quando sweep é defendido → transite para finalizações de cima',
                'Quando passagem é defendida → volte para o underhook',
                'O ciclo nunca para — sempre há o próximo movimento',
              ],
              commonMistake: 'Parar de se mover. Na preta, o movimento é contínuo — não há posição estática.',
              tip: 'O sistema completo da meia guarda é: posição → transição → ataque → defesa → posição.',
              youtubeQuery: 'half guard system jiu jitsu black belt',
            },
            {
              name: 'Ensinar como metodologia',
              entryPosition: 'No papel de professor — formal ou durante o treino.',
              description: 'Na faixa preta, a capacidade de transmitir é tão importante quanto a técnica.',
              steps: [
                'Explique a posição de entrada antes de qualquer técnica',
                'Demonstre uma vez em velocidade normal',
                'Demonstre novamente em câmera lenta com explicação verbal',
                'Drille com o aluno — corrija os erros principais (1-2 por vez)',
                'Aplique no contexto: posicional ou roll específico',
              ],
              commonMistake: 'Dar muita informação de uma vez. Foco em 1-2 pontos por treino por técnica.',
              tip: 'O melhor teste de se você realmente entende uma técnica é se você consegue ensiná-la.',
              youtubeQuery: 'how to teach jiu jitsu effectively methodology',
            },
          ],
        },
        {
          id: 'bl-s2', name: 'Filosofia e longevidade', icon: 'heart',
          color: '#7C3AED', bgColor: '#EEF2FF', textColor: '#7C3AED',
          techniques: [
            {
              name: 'Treinamento inteligente aos 30, 40, 50+',
              entryPosition: 'Qualquer pessoa treinando com mais de 28 anos de idade.',
              description: 'Como adaptar o treino para longevidade no jiu-jitsu. O objetivo é ainda treinar com 60.',
              steps: [
                'Priorize aquecimento completo — pelo menos 15 minutos',
                'Prefira técnica à resistência nos rolls — ego vai lesionar',
                'Escute o corpo: dores agudas = parar, dores musculares = OK continuar',
                'Sono e recuperação são treino também',
                'Diga não para rolls que não fazem sentido',
              ],
              commonMistake: 'Treinar como se tivesse 20 anos indefinidamente. Adaptar é sabedoria, não fraqueza.',
              tip: 'A faixa preta mais valiosa é a que você ainda usa com 60 anos.',
              youtubeQuery: 'jiu jitsu training longevity over 40 lifestyle',
            },
            {
              name: 'Legado no tatame',
              entryPosition: 'Reflexão para praticantes de qualquer nível, especialmente graus avançados.',
              description: 'O que você quer deixar no tatame — como professor, parceiro e praticante.',
              steps: [
                'Seja o parceiro que você gostaria de ter tido no início',
                'Treine os novatos com paciência — eles são o futuro da academia',
                'Partilhe conhecimento sem ego — o jiu-jitsu cresce quando é compartilhado',
                'Represente bem a arte fora do tatame',
                'O segredo não é evoluir rápido. É não parar.',
              ],
              commonMistake: 'Confundir graduação com chegada. Faixa preta é um novo começo.',
              tip: '"O segredo não é evoluir rápido. É não parar." — Filosofia Gracie Barra',
              youtubeQuery: 'jiu jitsu philosophy lifestyle black belt',
            },
          ],
        },
      ],
    },
  ],
}

// ── FAIXA ROXA (partial — key modules) ──
const purpleBelt: BeltCurriculum = {
  beltId: 'purple',
  modules: [
    {
      id: 'quedas', number: '01', label: 'Quedas', icon: 'arrow-down-circle',
      color: '#1D9E75', colorBg: '#DCFCE7',
      description: 'Projeções e contra-quedas essenciais para a luta em pé.',
      categories: [
        {
          id: 'q-proj', name: 'Projeções', icon: 'bolt',
          color: '#1D9E75', bgColor: '#DCFCE7', textColor: '#5DCAA5',
          techniques: [
            {
              name: 'Kouchi Gari',
              entryPosition: 'Controle manga + lapela. Diagonal ao adversário, joelhos semiflexos, peso equilibrado.',
              description: 'Varrida interna do tornozelo com desequilíbrio lateral. Uma das quedas mais seguras para o jiu-jitsu competitivo.',
              steps: [
                'Controle manga e lapela, encurte a distância',
                'Entre em diagonal pelo lado do adversário',
                'Encaixe o pé na parte interna do tornozelo',
                'Varra o tornozelo e projete com tração dos braços',
              ],
              commonMistake: 'Varrer sem puxar os braços. Varredura e puxada devem ser simultâneas.',
              tip: 'O timing supera a força — execute quando o adversário transfere peso para o lado.',
              youtubeQuery: 'kouchi gari jiu jitsu tutorial',
            },
            {
              name: 'Osoto Gari',
              entryPosition: 'Corpo a corpo, controle nuca + cotovelo adversário. Peso ligeiramente para frente.',
              description: 'Projeção com gancho externo. Clássico do judô, altamente eficaz no jiu-jitsu.',
              steps: [
                'Controle cabeça e cotovelo, desequilibre para trás',
                'Gire o ombro como uma porta abrindo',
                'Encaixe o gancho na coxa ou panturrilha',
                'Projete varrendo com tração dos braços',
              ],
              commonMistake: 'Entrar sem desequilibrar o adversário antes. O desequilíbrio para trás precede o gancho.',
              tip: 'Quebre o equilíbrio para trás primeiro — sem isso o gancho não funciona.',
              youtubeQuery: 'osoto gari jiu jitsu tutorial',
            },
            {
              name: 'Morote Seoi Nage',
              entryPosition: 'Entrada de costas 180°. Seu quadril ABAIXO do quadril adversário.',
              description: 'Projeção de ombro bilateral. Exige entrada explosiva de costas com encaixe duplo.',
              steps: [
                'Puxe para desequilibrar e entre de costas explosivamente',
                'Posicione os pés entre os pés do adversário',
                'Encaixe o quadril abaixo do quadril dele',
                'Incline o tronco para frente elevando o adversário',
              ],
              commonMistake: 'Quadril na mesma altura ou acima do adversário. Quadril alto = projeção impossível.',
              tip: 'O quadril deve entrar abaixo do adversário — é a alavanca principal.',
              youtubeQuery: 'morote seoi nage tutorial jiu jitsu',
            },
            {
              name: 'Tai Otoshi',
              entryPosition: 'Perpendicular ao adversário. Perna de bloqueio posicionada À FRENTE das pernas dele.',
              description: 'Projeção com bloqueio lateral. A perna bloqueio cria o obstáculo — não é alavanca de força.',
              steps: [
                'Puxe desequilibrando para frente e diagonal',
                'Gire os pés e posicione-se de lado ao adversário',
                'Coloque a perna como barreira entre as pernas dele',
                'Puxe com os braços — o adversário cai pela barreira',
              ],
              commonMistake: 'Forçar a perna como alavanca. Ela é obstáculo — os braços fazem o trabalho.',
              tip: 'A perna de bloqueio é um obstáculo, não uma alavanca de força.',
              youtubeQuery: 'tai otoshi judo jiu jitsu tutorial',
            },
            {
              name: 'Uchi Mata',
              entryPosition: 'Entrada de costas, quadril PRÓXIMO ao adversário para alcançar a virilha com a coxa.',
              description: 'Projeção com golpe interno na coxa. Alta efetividade em alto nível.',
              steps: [
                'Controle e desequilibre para frente',
                'Entre girando de costas, quadril próximo ao adversário',
                'Golpeie com a coxa interna na virilha ou coxa',
                'Projete girando o tronco e elevando a perna',
              ],
              commonMistake: 'Entrar longe do adversário. Sem proximidade de quadril, o golpe de coxa não alcança.',
              tip: 'Combine com feint de seoi nage para abrir espaço para o uchi mata.',
              youtubeQuery: 'uchi mata tutorial jiu jitsu',
            },
          ],
        },
        {
          id: 'q-def', name: 'Contra-quedas', icon: 'shield',
          color: '#0F6E56', bgColor: '#DCFCE7', textColor: '#9FE1CB',
          techniques: [
            {
              name: 'Defesa ao Single Leg',
              entryPosition: 'Adversário capturando uma perna. Seu peso na perna capturada, tronco ereto, mão na nuca.',
              description: 'Quando o adversário captura uma perna, jamba a cabeça, eleve o quadril e reverta para contra-ataque.',
              steps: [
                'Não ceda o quadril ao sentir o single leg',
                'Jamba a cabeça do adversário controlando pela nuca',
                'Eleve o quadril e retire a perna capturada',
                'Aplique guilhotina, suplex ou vá para as costas',
              ],
              commonMistake: 'Esperar o adversário completar a captura. O sprawl deve ser imediato ao sentir o movimento.',
              tip: 'O sprawl rápido impede o avanço — reaja antes de perder o equilíbrio.',
              youtubeQuery: 'defesa single leg jiu jitsu sprawl',
            },
            {
              name: 'Defesa ao Double Leg',
              entryPosition: 'Adversário com as duas mãos em suas pernas avançando. Você ereto com peso para trás.',
              description: 'Contra o double leg, execute o sprawl jogando o quadril para baixo.',
              steps: [
                'Sinta a entrada de double leg e afaste o quadril',
                'Jogue o quadril para baixo (sprawl) em cima do adversário',
                'Controle a nuca de barriga para baixo',
                'Aplique guilhotina de frente ou vá para as costas',
              ],
              commonMistake: 'Pular para CIMA no sprawl. O sprawl vai para BAIXO — o peso do corpo neutraliza.',
              tip: 'Reaja antes do adversário completar a entrada — o timing é no início do movimento.',
              youtubeQuery: 'defesa double leg sprawl jiu jitsu',
            },
          ],
        },
      ],
    },
    {
      id: 'gd-fechada', number: '02', label: 'Guard. Fechada', icon: 'shield',
      color: '#7C3AED', colorBg: '#EEF2FF',
      description: 'Posição base do jiu-jitsu. Dominar seus ataques é requisito fundamental para a faixa roxa.',
      categories: [
        {
          id: 'gf-bracos', name: 'Chaves de braço', icon: 'arm',
          color: '#D85A30', bgColor: '#FFF5EE', textColor: '#F0997B',
          techniques: [
            {
              name: 'Armlock (juji-gatame)',
              entryPosition: 'Você embaixo na guarda, adversário em cima. Controle o pulso do braço-alvo com AMBAS as mãos.',
              description: 'Chave direta hiperextendendo o cotovelo. Abra o ângulo, posicione a perna na cabeça e eleve o quadril.',
              steps: [
                'Controle o pulso do braço-alvo com as duas mãos',
                'Abra o ângulo colocando a perna no quadril adversário',
                'Gire e posicione a outra perna na cabeça',
                'Eleve o quadril — o joelho pressiona o cotovelo',
              ],
              commonMistake: 'Puxar o braço para baixo com força antes de elevar o quadril. Eleve o quadril primeiro.',
              tip: 'Quanto mais perpendicular o ângulo, mais eficiente a finalização.',
              youtubeQuery: 'armlock guarda fechada jiu jitsu tutorial',
            },
            {
              name: 'Americana (ude garami)',
              entryPosition: 'Braço adversário próximo ao chão. Empurre o punho acima da cabeça em 90° e trave com o peito.',
              description: 'Chave de ombro clássica. Trave o braço em L no chão e rotacione internamente o ombro.',
              steps: [
                'Controle o pulso no chão em 90° (braço em L)',
                'Passe o outro braço por baixo do cotovelo',
                'Pegue seu próprio pulso formando o grip "4"',
                'Eleve o cotovelo e empurre o pulso em arco',
              ],
              commonMistake: 'Deixar o cotovelo do adversário sair do chão. Seu peito deve prender o cotovelo no chão.',
              tip: 'Mantenha o cotovelo no chão — se ele levantar, a chave perde o efeito.',
              youtubeQuery: 'americana guarda fechada jiu jitsu',
            },
          ],
        },
        {
          id: 'gf-rasp', name: 'Raspagens', icon: 'refresh',
          color: '#BA7517', bgColor: '#FFFBEB', textColor: '#EF9F27',
          techniques: [
            {
              name: 'Tesoura (scissor sweep)',
              entryPosition: 'Adversário postado, joelhos no chão. Perna no abdômen + perna atrás do joelho.',
              description: 'Movimento de tesoura entre o joelho e o pescoço. Requer sincronização das duas pernas.',
              steps: [
                'Controle manga e colarinho do adversário',
                'Posicione uma perna no estômago, outra atrás do joelho',
                'Puxe o colarinho enquanto empurra o joelho',
                'Execute o movimento de tesoura para derrubar',
              ],
              commonMistake: 'Mover as pernas em sequência. A tesoura precisa ser simultânea — as duas pernas ao mesmo tempo.',
              tip: 'As duas pernas devem mover simultaneamente em direções opostas — isso gera o poder.',
              youtubeQuery: 'tesoura scissor sweep guarda fechada jiu jitsu',
            },
            {
              name: 'Hip bump sweep',
              entryPosition: 'Adversário postado na guarda. Você abre a guarda, pés no chão apoiados.',
              description: 'Explosão do quadril para cima enquanto empurra o ombro do adversário.',
              steps: [
                'Abra a guarda e apoie-se nos pés',
                'Sente explosivamente elevando o quadril',
                'Empurre o ombro do adversário com o mesmo movimento',
                'Controle o pescoço e finalize na montada ou Kimura',
              ],
              commonMistake: 'Executar devagar. Hip bump funciona APENAS com explosão.',
              tip: 'Sem a explosão do quadril o adversário facilmente defende com a base.',
              youtubeQuery: 'hip bump sweep jiu jitsu',
            },
            {
              name: 'Pêndulo (pendulum sweep)',
              entryPosition: 'Adversário postado. Controle manga E cotovelo do mesmo braço. Pé no quadril.',
              description: 'Raspagem usando o swing da perna para gerar momentum.',
              steps: [
                'Controle manga e cotovelo do adversário',
                'Coloque um pé no quadril do adversário',
                'Gire o quadril 90° e desça a perna de apoio',
                'Swing da perna para gerar força e vire',
              ],
              commonMistake: 'Controlar só a manga sem o cotovelo. Sem controle do cotovelo, o braço dobra e escapa.',
              tip: 'Funciona bem em combinação com tentativa de americana como setup.',
              youtubeQuery: 'pendulum sweep guarda fechada jiu jitsu',
            },
            {
              name: 'Flower sweep (florinha)',
              entryPosition: 'Adversário postado. Sua mão alcança o tornozelo TRASEIRO adversário.',
              description: 'Capture o tornozelo traseiro e use a perna como alavanca para a montada.',
              steps: [
                'Abra a guarda e controle o pulso do adversário',
                'Capture o pé/tornozelo traseiro com a mão',
                'Coloque o pé na dobra do joelho oposto',
                'Puxe o tornozelo e vire para montar',
              ],
              commonMistake: 'Capturar muito baixo (perto do pé). Quanto mais próximo do joelho você segura, mais alavanca.',
              tip: 'Quanto mais alto você segura o tornozelo, mais força você tem.',
              youtubeQuery: 'flower sweep guarda fechada jiu jitsu',
            },
          ],
        },
        {
          id: 'gf-str', name: 'Estrangulamentos', icon: 'circle-x',
          color: '#E24B4A', bgColor: '#FEF2F2', textColor: '#F09595',
          techniques: [
            {
              name: 'Gravata cruzada (cross collar)',
              entryPosition: 'Adversário postado na guarda. Cotovelos para baixo e para dentro. Grip profundo.',
              description: 'Estrangulamento clássico com kimono. Pegada profunda nos dois lados do colarinho.',
              steps: [
                'Pegue profundo no colarinho (4 dedos) com a primeira mão',
                'Insira a outra mão no colarinho oposto',
                'Cruze os pulsos atrás do pescoço',
                'Contraia os cotovelos e gire os pulsos',
              ],
              commonMistake: 'Grip raso no colarinho. A mão inteira precisa entrar — isso define 80% da eficiência.',
              tip: 'Quanto mais profunda a pegada no colarinho, mais eficiente o estrangulamento.',
              youtubeQuery: 'gravata cruzada cross collar jiu jitsu',
            },
            {
              name: 'Guilhotina da guarda',
              entryPosition: 'Adversário abaixou a cabeça dentro da sua guarda. Antebraço posiciona NA FRENTE da garganta.',
              description: 'Quando o adversário abaixa a cabeça. Antebraço na traqueia, feche a guarda e puxe para cima.',
              steps: [
                'Quando ele abaixa a cabeça, envolva o pescoço',
                'Posicione o antebraço na traqueia ou carótida',
                'Feche a guarda com as pernas para controle',
                'Puxe o pescoço para cima e eleve o quadril',
              ],
              commonMistake: 'Antebraço atrás do pescoço em vez da frente da garganta. Atrás não estrangula nada.',
              tip: 'O antebraço deve estar na traqueia/carótida — não atrás do pescoço.',
              youtubeQuery: 'guilhotina guarda fechada jiu jitsu',
            },
          ],
        },
      ],
    },
    {
      id: 'costas', number: '07', label: 'Costas', icon: 'user-check',
      color: '#E24B4A', colorBg: '#FEF2F2',
      description: 'A posição mais dominante do jiu-jitsu — 4 pontos e melhores oportunidades de finalização.',
      categories: [
        {
          id: 'co-str', name: 'Estrangulamentos', icon: 'circle-x',
          color: '#E24B4A', bgColor: '#FEF2F2', textColor: '#F09595',
          techniques: [
            {
              name: 'Mata Leão (RNC)',
              entryPosition: 'Você nas costas adversárias com dois ganchos. Braço em volta do pescoço. Outra mão no bíceps.',
              description: 'O estrangulamento mais icônico. Antebraço na carótida, bíceps como suporte, mão na mão atrás da cabeça.',
              steps: [
                'Da pegada de costas, passe o braço em volta do pescoço',
                'Posicione o antebraço na carótida',
                'Coloque a mão no bíceps do outro braço',
                'Traga o outro braço por trás da cabeça e aperte',
              ],
              commonMistake: 'Apertar na traqueia em vez da carótida. Traqueia = lento e desconfortável. Carótida = segundos.',
              tip: 'O estrangulamento ideal é na carótida, não na traqueia — mais rápido e seguro.',
              youtubeQuery: 'mata leão rear naked choke tutorial',
            },
            {
              name: 'Arco e Flecha',
              entryPosition: 'Das costas com kimono. Mão no colarinho PROFUNDO (4 dedos). Um gancho vira pé no joelho.',
              description: 'Estrangulamento com kimono puxando colarinho e perna em direções opostas.',
              steps: [
                'Passe a mão pelo pescoço e pegue o colarinho (4 dedos)',
                'Remova um gancho e coloque o pé no joelho/coxa',
                'Estenda as costas e puxe o colarinho',
                'A pressão na carótida finaliza',
              ],
              commonMistake: 'Grip raso no colarinho. A mão inteira precisa entrar — grip superficial não finaliza.',
              tip: 'Um dos mais poderosos do jiu-jitsu com kimono — difícil escapar quando bem aplicado.',
              youtubeQuery: 'arco flecha bow arrow choke jiu jitsu',
            },
          ],
        },
      ],
    },
  ],
}

export const BELT_CURRICULUM: BeltCurriculum[] = [
  whiteBelt,
  blueBelt,
  purpleBelt,
  brownBelt,
  blackBelt,
]

export function getCurriculumByBelt(beltId: BeltCurriculum['beltId']): BeltCurriculum | undefined {
  return BELT_CURRICULUM.find(b => b.beltId === beltId)
}

export function getTotalTechniques(beltId: BeltCurriculum['beltId']): number {
  const belt = getCurriculumByBelt(beltId)
  if (!belt) return 0
  return belt.modules.reduce((acc, mod) =>
    acc + mod.categories.reduce((a, cat) => a + cat.techniques.length, 0), 0
  )
}

export const BELTS = [
  { id: 'white' as const, name: 'Branca', color: '#E8E8E8', textColor: '#555', emoji: '⚪', desc: 'Posições básicas, defesa, sobrevivência e disciplina.', maxDeg: 4 },
  { id: 'blue' as const, name: 'Azul', color: '#2563EB', textColor: '#fff', emoji: '🔵', desc: 'Ataques, estratégia e desenvolvimento do estilo.', maxDeg: 4 },
  { id: 'purple' as const, name: 'Roxa', color: '#7C3AED', textColor: '#fff', emoji: '🟣', desc: 'Refinamento, sequências e jogo definido.', maxDeg: 4 },
  { id: 'brown' as const, name: 'Marrom', color: '#92400E', textColor: '#fff', emoji: '🟤', desc: 'Maturidade técnica, fluidez e postura de professor.', maxDeg: 4 },
  { id: 'black' as const, name: 'Preta', color: '#1A1A1A', textColor: '#fff', emoji: '⚫', desc: 'Excelência técnica e capacidade de transmitir o jiu-jitsu.', maxDeg: 6 },
]
