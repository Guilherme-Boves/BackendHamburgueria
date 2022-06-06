// API REST dos prestadores
import express from 'express'
import { connectToDatabase } from '../utils/mongodb.js'
import { check, validationResult } from 'express-validator'

const router = express.Router()
const nomeCollection = 'produtos'
const { db, ObjectId } = await connectToDatabase()

/**********************************************
 * Validações
 * 
 **********************************************/
const validaProduto = [
    check('nome')
    .not().isEmpty().trim().withMessage('É obrigatório informar o NOME do Produto')    
    .isLength({ min: 3, max: 100 }).withMessage('O tamanho do NOME informado é inválido.')
    .custom((value, { req }) => {
      return db.collection(nomeCollection).find({ nome: { $eq: value } }).toArray()
        .then((nome) => {
          if (nome.length && !req.body._id) {
            return Promise.reject(`O nome ${value} já está informado em outro Produto`)
          }
        })
    }),
    check('preco')
        .not().isEmpty().trim().withMessage('É obrigatório informar a o Preço do Produto')
        .isNumeric().withMessage('O Preço não pode conter caracteres especiais, apenas números')
]


check('text_settings_descriptions.*.value')

/**********************************************
 * GET /api/produtos
 **********************************************/
 router.get('/', async (req, res) => { 
    try {
      db.collection(nomeCollection).find({}, {
        projection: { senha: false }
      }).sort({ nome: 1 }).toArray((err, docs) => {
        if (!err) {         
          res.status(200).json(docs)
        }
      })
    } catch (err) {      
      res.status(500).json({
        errors: [
          {
            value: `${err.message}`,
            msg: 'Erro ao obter a listagem dos produtos',
            param: '/'
          }
        ]
      })
    }
  })

/**********************************************
 * GET /produtos/id/:id
 **********************************************/
router.get("/id/:id", async (req, res) => {      
    try {
        db.collection(nomeCollection).find({ "_id": { $eq: ObjectId(req.params.id) } }).toArray((err, docs) => {
            if (err) {
                res.status(400).json(err) //bad request
            } else {
                res.status(200).json(docs) //retorna o documento
            }
        })
    } catch (err) {
        res.status(500).json({ "error": err.message })
    }
})

/**********************************************
 * GET /produtos/preco/:preco
 **********************************************/
router.get("/preco/:preco", async (req, res) => {    
    try {
        db.collection(nomeCollection).find({ preco: { $eq: req.params.preco } }).toArray((err, docs) => {
            if (err) {
                res.status(400).json(err) //bad request
            } else {
                res.status(200).json(docs) //retorna o documento
            }
        })
    } catch (err) {
        res.status(500).json({ "error": err.message })
    }
})

/**********************************************
 * POST /produtos/
 **********************************************/
router.post('/', validaProduto, async (req, res) => {  
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json(({
            errors: errors.array()
        }))
    } else {
        await db.collection(nomeCollection)
            .insertOne(req.body)
            .then(result => res.status(201).send(result)) //retorna o ID do documento inserido)
            .catch(err => res.status(400).json(err))
    }
})

/**********************************************
 * PUT /produtos
 * Alterar um produto pelo ID
 **********************************************/
router.put('/', validaProduto, async (req, res) => {
  let idDocumento = req.body._id
  delete req.body._id //removendo o ID do body para o update não apresentar o erro 66   
    const schemaErrors = validationResult(req)
    if (!schemaErrors.isEmpty()) {
        return res.status(403).json(({
            errors: schemaErrors.array() //retorna um Forbidden
        }))
    } else {
        await db.collection(nomeCollection)
            .updateOne({ '_id': { $eq: ObjectId(idDocumento) } },
                { $set: req.body }
            )
            .then(result => res.status(202).send(result))
            .catch(err => res.status(400).json(err))
    }
})

/**********************************************
 * DELETE /produtos/
 **********************************************/
router.delete('/:id', async (req, res) => {    
    await db.collection(nomeCollection)
        .deleteOne({ "_id": { $eq: ObjectId(req.params.id) } })
        .then(result => res.status(202).send(result))
        .catch(err => res.status(400).json(err))
})

export default router