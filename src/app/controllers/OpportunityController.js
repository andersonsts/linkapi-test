const js2xmlparser = require('js2xmlparser');
const axios = require('axios');
const addDays = require('date-fns/addDays');
const { parseISO } = require('date-fns');
const format = require('date-fns/format');

const Opportunity = require('../schemas/Opportunity');

const apiPipedrive = require('../services/apiPipedrive');

class OpportunityController {
  async store(_, response) {
    const { data: responseDataPipedrive } = await apiPipedrive.get('deals', {
        params: {
            status: 'won',
            api_token: process.env.API_PIPEDRIVE_KEY,
        }
    });

    const { data: opportunitiesWon } = responseDataPipedrive;

    var arrayOfOrders = opportunitiesWon.map(opportunity => ({
      cliente: {
            name: opportunity.person_name
          },
          transporte: {
            volumes: {
              volume: {
                servico: 'SEDEX - CONTRATO'
              },
              volume: {
                servico: 'PAC - CONTRATO'
              }
            }
          },
          itens: {
            item: {
              codigo: '001',
              descricao: opportunity.title,
              qtde: 1,
              vlr_unit: opportunity.value
            },
          },
          parcelas: {
            parcela: {
              vlr: 2
            },
          }
    }));

    const currentDate = format(new Date(), "yyyy-MM-dd");
    const currentDateLimit = format(addDays(new Date(), 1), "yyyy-MM-dd");

    const opportunityExists = await Opportunity.findOne(
      {
        date: {
          $gte: currentDate,
          $lte: currentDateLimit
        },
      },
    );

    if(!!opportunityExists) {
      const idsOpportunities = opportunityExists.opportunities
        .map(opportunity => opportunity.order_id);

      var newOpportunities = opportunitiesWon
        .map(opportunity => !idsOpportunities.includes(opportunity.id) ? opportunity : null)

      newOpportunities = newOpportunities.filter(opportunities => opportunities !== null);

      if(newOpportunities.length === 0) {
        return response.json({ message: 'Você não possui novas oportunidades para cadastro.'});
      } else {
        newOpportunities.forEach(opportunity => {
          opportunityExists.opportunities.push({
            order_id: opportunity.id,
            title: opportunity.title,
            value: opportunity.value,
            person_name: opportunity.person_name,
            formatted_value: opportunity.formatted_value,
            owner_name: opportunity.owner_name
          });
        });

        opportunityExists.amount = opportunityExists.opportunities.map(opportunity => opportunity.value)
          .reduce((value, total) => value + total);

        opportunityExists.save();

        var arrayOfOrders = newOpportunities.map(opportunity => ({
          cliente: {
                name: opportunity.person_name
              },
              transporte: {
                volumes: {
                  volume: {
                    servico: 'SEDEX - CONTRATO'
                  },
                  volume: {
                    servico: 'PAC - CONTRATO'
                  }
                }
              },
              itens: {
                item: {
                  codigo: '001',
                  descricao: opportunity.title,
                  qtde: 1,
                  vlr_unit: opportunity.value
                },
              },
              parcelas: {
                parcela: {
                  vlr: 2
                },
              }
        }));

        const ordersXML = arrayOfOrders.map(order => js2xmlparser.parse("pedido", order));

        const orderXMLWithEncode = ordersXML.map(order => encodeURIComponent(order));

        await axios.all(
          orderXMLWithEncode.map(order =>
            axios.post(
              `https://bling.com.br/Api/v2/pedido/json/?apikey=${process.env.API_BLING_KEY}&xml=${order}`
            ),
          )
        );

        return response.json(opportunityExists);
      }
    } else {
      const ordersXML = arrayOfOrders.map(order => js2xmlparser.parse("pedido", order));

      const orderXMLWithEncode = ordersXML.map(order => encodeURIComponent(order));

      await axios.all(
        orderXMLWithEncode.map(order =>
          axios.post(
            `https://bling.com.br/Api/v2/pedido/json/?apikey=${process.env.API_BLING_KEY}&xml=${order}`
          ),
        )
      );

      const opportunities = opportunitiesWon.map(opportunity => ({
        order_id: opportunity.id,
        person_name: opportunity.person_name,
        title: opportunity.title,
        value: opportunity.value,
        formatted_value: opportunity.formatted_value,
        owner_name: opportunity.owner_name
      }));

      const amount = opportunitiesWon.map(opportunity => opportunity.value)
                .reduce((currentValue, total) => total + currentValue);

      const opportunitiesRegistered = await Opportunity.create({
        opportunities,
        date: new Date(),
        amount,
      })

      return response.json(opportunitiesRegistered);
    }
  }

  async index(request, response) {
    const { day = new Date().getDate() } = request.query;

    const dayFormatted = Number(day);
    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    const currentDate = format(new Date(year, month, dayFormatted), 'yyyy-MM-dd');
    const currentDateLimit = addDays(parseISO(currentDate), 1);

    const opportunitiesByDay = await Opportunity.findOne(
      {
        date: {
          $gte: currentDate,
          $lte: currentDateLimit
        },
      }
    )

    return response.json(opportunitiesByDay);
  }
}

module.exports = new OpportunityController();
