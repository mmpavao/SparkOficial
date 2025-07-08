/**
 * DIRECT DATA API SERVICE
 * Serviço para integração com a API Direct Data - Dossiê de Crédito Completo
 * URL: https://apiv3.directd.com.br/api/DossieCreditoCompleto
 */

interface DirectDataResponse {
  metaDados: {
    consultaNome: string;
    consultaUid: string;
    chave: string;
    usuario: string;
    mensagem: string;
    ip: string;
    resultadoId: number;
    resultado: string;
    apiVersao: string;
    gerarComprovante: boolean;
    urlComprovante: string;
    assincrono: boolean;
    data: string;
    tempoExecucaoMs: number;
  };
  retorno: {
    documentoConsultado: string;
    entidadeJuridica: {
      statusCadastroPositivo: string;
      dadosCadastrais: {
        situacaoCadastral: string;
        razaoSocial: string;
        nomeFantasia: string;
        naturezaJuridica: string;
        quantidadeFilial: number;
        nire: number;
        codigoAtividadePrincipal: string;
        descricaoAtividadePrincipal: string;
        codigoAtividadeSecundaria: string;
        descricaoAtividadeSecundaria: string;
        dataFundacao: string;
        endereco: {
          logradouro: string;
          numero: string;
          complemento: string;
          bairro: string;
          cidade: string;
          uf: string;
          cep: string;
        };
        email: string;
        telefone: string;
        outrosEnderecos: Array<{
          logradouro: string;
          numero: string;
          complemento: string;
          bairro: string;
          cidade: string;
          uf: string;
          cep: string;
        }>;
        outrosEmails: string[];
        outrosTelefones: string[];
        outrasEmpresas: Array<{
          documento: string;
          dataFundacao: string;
        }>;
      };
      quadroSocietario: {
        informacoes: Array<{
          entidade: string;
          documento: string;
          nomeEmpresa: string;
          status: string;
          percentualParticipacao: number;
          valorFinanceiro: number;
          funcaoSocio: string;
          dataInicioSociedade: string;
          dataInicioEntrada: string;
          dataSaida: string;
          socioAdministrador: boolean;
        }>;
        capitalSocial: number;
      };
      scoreEntidades: {
        entidadeFisica: {
          score: number;
          capacidadePagamento: string;
          perfil: string;
        };
        entidadeJuridica: {
          score: number;
          motivos: string[];
          indicadoresNegocio: Array<{
            indicador: string;
            status: string;
            risco: string;
            observacao: string;
          }>;
        };
        observacao: string;
      };
      pendenciaFinanceira: {
        status: string;
        totalPendencia: number;
        protestos: Array<{
          situacao: string;
          valorTotal: number;
          cartorios: Array<{
            codigoCidade: string;
            codigoCartorio: string;
            nome: string;
            telefone: string;
            endereco: string;
            cidade: string;
            quantidadeProtestos: number;
            valorProtestado: number;
          }>;
          observacao: string;
        }>;
        acoesJudiciais: Array<{
          numeroProcessoPrincipal: string;
          numeroProcessoAntigo: string;
          comarca: string;
          forum: string;
          vara: string;
          parteAcusada: string;
          dataAjuizamento: string;
          tipoProcesso: string;
          status: string;
          valor: number;
          autorProcesso: string;
          cidade: string;
          tipoTribunal: string;
          documento: string;
        }>;
        recuperacoesJudiciaisFalencia: Array<{
          documento: string;
          nomeEmpresa: string;
          motivo: string;
          valor: number;
          numeroContrato: string;
          tipoParticipacao: string;
          status: string;
          dataOcorrencia: string;
          dataInclusao: string;
          dataModificacao: string;
          endereco: {
            logradouro: string;
            numero: string;
            complemento: string;
            bairro: string;
            cidade: string;
            uf: string;
            cep: string;
          };
        }>;
        chequesSemFundo: Array<{
          entidade: string;
          documento: string;
          codigoBanco: string;
          nomeAgencia: string;
          numeroAgencia: string;
          dataUltimaOcorrencia: string;
          quantidadeOcorrencia: number;
        }>;
      };
      indicadores: {
        quantidadeIndicadores: number;
        indicacoes: Array<{
          conceito: string;
          indicadoresNegocio: Array<{
            faixa: string;
            risco: string;
          }>;
        }>;
        observacao: string;
      };
      consulta: {
        cnpj: string;
        ultimos30Dias: number;
        ultimos60Dias: number;
        ultimos90Dias: number;
        mais90Dias: number;
        detalhesConsulta: Array<{
          data: string;
          quantidadeConsultada: number;
          segmentoEmpresa: string;
        }>;
      };
      conglomerado: {
        consultas: Array<{
          cnpj: string;
          ultimos30Dias: number;
          ultimos60Dias: number;
          ultimos90Dias: number;
          mais90Dias: number;
          detalhesConsulta: Array<{
            data: string;
            quantidadeConsultada: number;
            segmentoEmpresa: string;
          }>;
        }>;
      };
      dadosEmpresariais: Array<{
        entidade: string;
        documento: string;
        nomeEmpresa: string;
        status: string;
        percentualParticipacao: number;
        valorFinanceiro: number;
        funcaoSocio: string;
        dataInicioSociedade: string;
        dataInicioEntrada: string;
        dataSaida: string;
        socioAdministrador: boolean;
      }>;
    };
  };
}

export class DirectDataService {
  private static readonly API_URL = 'https://apiv3.directd.com.br/api/DossieCreditoCompleto';
  private static readonly TOKEN = process.env.DIRECTD_API_TOKEN;

  /**
   * Consulta dados completos de crédito de uma empresa via CNPJ
   * @param cnpj - CNPJ da empresa (com ou sem formatação)
   * @returns Dados completos de crédito da empresa
   */
  static async consultarCreditoCompleto(cnpj: string): Promise<DirectDataResponse> {
    if (!this.TOKEN) {
      throw new Error('DIRECTD_API_TOKEN não configurado');
    }

    // Remove formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    const url = `${this.API_URL}?CNPJ=${cnpjLimpo}&TOKEN=${this.TOKEN}`;

    console.log(`🔍 [DirectData] Consultando crédito para CNPJ: ${cnpjLimpo}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Spark-Comex/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const data: DirectDataResponse = await response.json();

      console.log(`✅ [DirectData] Consulta realizada com sucesso`);
      console.log(`📊 [DirectData] Resultado: ${data.metaDados.resultado}`);
      console.log(`⏱️ [DirectData] Tempo de execução: ${data.metaDados.tempoExecucaoMs}ms`);

      return data;
    } catch (error) {
      console.error(`❌ [DirectData] Erro na consulta:`, error);
      throw error;
    }
  }

  /**
   * Processa dados da Direct Data e converte para formato do sistema
   * @param data - Resposta da API Direct Data
   * @returns Dados processados para o sistema
   */
  static processarDadosCredito(data: DirectDataResponse) {
    const { entidadeJuridica } = data.retorno;

    // Calcula score final baseado nos dados reais
    const scoreFinal = entidadeJuridica.scoreEntidades.entidadeJuridica.score || 0;

    // Determina categoria do score
    let categoriaScore = 'Baixo';
    let corScore = 'text-red-600';
    
    if (scoreFinal >= 800) {
      categoriaScore = 'Excelente';
      corScore = 'text-green-600';
    } else if (scoreFinal >= 600) {
      categoriaScore = 'Bom';
      corScore = 'text-blue-600';
    } else if (scoreFinal >= 400) {
      categoriaScore = 'Regular';
      corScore = 'text-yellow-600';
    } else {
      categoriaScore = 'Baixo';
      corScore = 'text-red-600';
    }

    // Processa pendências financeiras
    const pendencias = entidadeJuridica.pendenciaFinanceira;
    const totalProtestos = pendencias.protestos.reduce((sum, p) => sum + p.valorTotal, 0);
    const totalAcoes = pendencias.acoesJudiciais.reduce((sum, a) => sum + a.valor, 0);
    const totalRecuperacoes = pendencias.recuperacoesJudiciaisFalencia.reduce((sum, r) => sum + r.valor, 0);
    const totalChequesSemFundo = pendencias.chequesSemFundo.length;

    // Determina situação da empresa
    const situacaoEmpresa = entidadeJuridica.dadosCadastrais.situacaoCadastral;
    const empresaAtiva = situacaoEmpresa === 'ATIVA';

    return {
      // Dados básicos da empresa
      empresa: {
        cnpj: data.retorno.documentoConsultado,
        razaoSocial: entidadeJuridica.dadosCadastrais.razaoSocial,
        nomeFantasia: entidadeJuridica.dadosCadastrais.nomeFantasia,
        situacaoCadastral: situacaoEmpresa,
        naturezaJuridica: entidadeJuridica.dadosCadastrais.naturezaJuridica,
        dataFundacao: entidadeJuridica.dadosCadastrais.dataFundacao,
        atividadePrincipal: entidadeJuridica.dadosCadastrais.descricaoAtividadePrincipal,
        capitalSocial: entidadeJuridica.quadroSocietario.capitalSocial,
        quantidadeFiliais: entidadeJuridica.dadosCadastrais.quantidadeFilial,
        endereco: entidadeJuridica.dadosCadastrais.endereco,
        email: entidadeJuridica.dadosCadastrais.email,
        telefone: entidadeJuridica.dadosCadastrais.telefone,
        ativa: empresaAtiva
      },

      // Score de crédito
      score: {
        valor: scoreFinal,
        categoria: categoriaScore,
        cor: corScore,
        motivos: entidadeJuridica.scoreEntidades.entidadeJuridica.motivos,
        observacao: entidadeJuridica.scoreEntidades.observacao
      },

      // Análise de risco
      risco: {
        nivel: this.calcularNivelRisco(scoreFinal, totalProtestos, totalAcoes, totalRecuperacoes),
        indicadores: entidadeJuridica.scoreEntidades.entidadeJuridica.indicadoresNegocio,
        observacoes: entidadeJuridica.indicadores.observacao
      },

      // Pendências financeiras
      pendencias: {
        status: pendencias.status,
        totalPendencia: pendencias.totalPendencia,
        protestos: {
          quantidade: pendencias.protestos.length,
          valor: totalProtestos,
          detalhes: pendencias.protestos
        },
        acoesJudiciais: {
          quantidade: pendencias.acoesJudiciais.length,
          valor: totalAcoes,
          detalhes: pendencias.acoesJudiciais
        },
        recuperacoesJudiciais: {
          quantidade: pendencias.recuperacoesJudiciaisFalencia.length,
          valor: totalRecuperacoes,
          detalhes: pendencias.recuperacoesJudiciaisFalencia
        },
        chequesSemFundo: {
          quantidade: totalChequesSemFundo,
          detalhes: pendencias.chequesSemFundo
        }
      },

      // Histórico de consultas
      consultas: {
        ultimos30Dias: entidadeJuridica.consulta.ultimos30Dias,
        ultimos60Dias: entidadeJuridica.consulta.ultimos60Dias,
        ultimos90Dias: entidadeJuridica.consulta.ultimos90Dias,
        mais90Dias: entidadeJuridica.consulta.mais90Dias,
        detalhes: entidadeJuridica.consulta.detalhesConsulta
      },

      // Quadro societário
      socios: entidadeJuridica.quadroSocietario.informacoes,

      // Metadados da consulta
      metaDados: {
        consultaUid: data.metaDados.consultaUid,
        data: data.metaDados.data,
        tempoExecucao: data.metaDados.tempoExecucaoMs,
        apiVersao: data.metaDados.apiVersao
      }
    };
  }

  /**
   * Calcula nível de risco baseado nos dados reais
   */
  private static calcularNivelRisco(score: number, protestos: number, acoes: number, recuperacoes: number): string {
    let pontuacaoRisco = 0;

    // Score baixo aumenta risco
    if (score < 400) pontuacaoRisco += 3;
    else if (score < 600) pontuacaoRisco += 2;
    else if (score < 800) pontuacaoRisco += 1;

    // Pendências financeiras aumentam risco
    if (protestos > 0) pontuacaoRisco += 2;
    if (acoes > 0) pontuacaoRisco += 2;
    if (recuperacoes > 0) pontuacaoRisco += 3;

    // Determina nível final
    if (pontuacaoRisco >= 6) return 'ALTO';
    if (pontuacaoRisco >= 3) return 'MÉDIO';
    return 'BAIXO';
  }
}