const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const Blog = require('./models/blog')
const Fb = require('./models/feedback')
const fs = require('fs')
const { readFile } = require('fs/promises')
const keyword_extractor = require('keyword-extractor')
const { last, lte } = require('lodash')
const e = require('express')
var porterStemmer = require('@stdlib/nlp-porter-stemmer')
// const SpellCheck = require('@caijs/spellcheck')
var spelling = require('spelling'),
  dictionary = require('spelling/dictionaries/en_US.js')
var dict = new spelling(dictionary)

//reading the contents from the constants folder

let final_kw = fs.readFileSync(__dirname + '/constants/keywords.txt', {
  encoding: 'utf-8',
})
final_kw = final_kw.split('\n')
let idf = fs.readFileSync(__dirname + '/constants/idf.txt', {
  encoding: 'utf-8',
})
idf = idf.split('\n')
let tfidf = fs.readFileSync(__dirname + '/constants/tfidf.txt', {
  encoding: 'utf-8',
})
tfidf = tfidf.split('\n')
let ps_titles = fs.readFileSync(__dirname + '/dataset/problem_titles.txt', {
  encoding: 'utf-8',
})
ps_titles = ps_titles.split('\n')
let ps_difficulties = fs.readFileSync(
  __dirname + '/dataset/problem_difficulties.txt',
  {
    encoding: 'utf-8',
  }
)
ps_difficulties = ps_difficulties.split('\n')
let ps_submissions = fs.readFileSync(
  __dirname + '/dataset/problem_submissions.txt',
  {
    encoding: 'utf-8',
  }
)
ps_submissions = ps_submissions.split('\n')
let ps_urls = fs.readFileSync(__dirname + '/dataset/problem_urls.txt', {
  encoding: 'utf-8',
})
ps_urls = ps_urls.split('\n')
let ps_codes = fs.readFileSync(__dirname + '/dataset/problem_codes.txt', {
  encoding: 'utf-8',
})
ps_codes = ps_codes.split('\n')

// express app
const app = express()
// connect to mongodb & listen for requests
const dbURI =
  'mongodb+srv://adarsh_modi_01:adarsh_modi_01@nodetuts.ei3k1.mongodb.net/node-tuts2?retryWrites=true&w=majority'

const PORT = process.env.PORT || 3000

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(PORT)
    console.log('mongoDb connected successfully')
  })
  .catch((err) => console.log(err))

// register view engine
app.set('view engine', 'ejs')

// middleware & static files
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use((req, res, next) => {
  res.locals.path = req.path
  next()
})

//adding data to the mongoDb datebase

// for (let i = 0; i < 1450; i++) {
//   cur_tfidf = []
//   let sum = 0
//   for (let j = i * final_kw.length; j < (i + 1) * final_kw.length; j++) {
//     cur_tfidf.push(parseFloat(tfidf[j]))
//     sum += parseFloat(tfidf[j])
//   }
//   // ps_statement = ''
//   // const readStream = fs.createReadStream(
//   //   './dataset/ps/ps_' + (i + 1).toString() + '.txt'
//   // )
//   // readStream.on('data', (chunk) => {
//   //   ps_statement += chunk.toString()
//   // })
//   let ps_statement = fs.readFileSync(
//     __dirname + '/dataset/ps/ps_' + (i + 1).toString() + '.txt',
//     {
//       encoding: 'utf-8',
//     }
//   )
//   ps_statement = ps_statement.toString()
//   const blog = new Blog({
//     index_of_ps: i + 1,
//     title: ps_titles[i],
//     code: ps_codes[i],
//     diff: parseInt(ps_difficulties[i]),
//     submissions: parseInt(ps_submissions[i]),
//     url_ps: ps_urls[i],
//     // tfidf: cur_tfidf,
//     statement: ps_statement,
//   })
//   blog
//     .save()
//     .then((result) => {
//       // res.redirect('/blogs')
//       console.log('data added successfully')
//     })
//     .catch((err) => {
//       console.log(err)
//     })
// }

top10_blogs_copy = []
// routes

app.get('/', (req, res) => {
  console.log('search reached')
  res.redirect('/create')
})

// feebacks page
app.get('/feedbacks', (req, res) => {
  Fb.find({})
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render('feedback', { feedbacks: result, title: 'All Feedbacks' })
    })
    .catch((err) => {
      console.log(err)
    })
  console.log('/feedbacks reached')
})

// blog routes
app.get('/blogs/create', (req, res) => {
  res.render('create', { title: 'Search a question' })
})

app.get('/blogs', (req, res) => {
  top10_blogs_copy = []
  for (let i = 1; i < 100; i++) {
    top10_blogs_copy.push(i)
  }
  Blog.find({
    index_of_ps: { $in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  })
    .sort({ createdAt: -1 })
    .then((result) => {
      res.render('index', { blogs: result, title: 'All Questions', query: '' })
    })
    .catch((err) => {
      console.log(err)
    })
  console.log('/blogs reached')
})

function cleaner(pss) {
  let punctuationless = pss.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
  pss = punctuationless.replace(/\s{2,}/g, ' ')
  pss = pss.replace(/\d+/g, '')
  pss = pss.replace(/\s+/g, ' ').trim()
  pss = pss.replace(',', ' ')
  pss = pss.replace(/[^\w\s]/g, '').toLowerCase()
  return pss
}

function return_query_tfidf(q) {
  q = cleaner(q)
  // q =
  const query_keywords = keyword_extractor.extract(q, {
    language: 'english',
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: false,
  })
  for (let j = 0; j < query_keywords.length; j++) {
    query_keywords[j] = porterStemmer(query_keywords[j])
    if (dict.search(query_keywords[j])[0] != undefined)
      query_keywords[j] = dict.search(query_keywords[j])[0].word
  }
  console.log(query_keywords)
  query_tf = []
  for (let j = 0; j < final_kw.length; j++) {
    query_tf.push(0)
  }
  if (query_keywords.length == 0) {
    console.log('query_keyword length is 0')
  }
  for (let j = 0; j < query_keywords.length; j++) {
    if (final_kw.indexOf(query_keywords[j]) != -1)
      query_tf[final_kw.indexOf(query_keywords[j])] += 1
  }
  query_tfidf = []
  for (let j = 0; j < final_kw.length; j++) {
    query_tfidf.push(query_tf[j])
    query_tfidf[j] = (query_tfidf[j] * idf[j]) / query_keywords.length
  }
  return query_tfidf
}
function calc_similarity(a, b) {
  sum = 0
  sum1 = 0
  sum2 = 0
  for (let i = 0; i < final_kw.length; i++) {
    sum += parseFloat(a[i] * b[i])
    sum1 += parseFloat(a[i] * a[i])
    sum2 += parseFloat(b[i] * b[i])
  }
  sum3 = Math.sqrt(sum1 * sum2)
  if (sum3 == 0) return 0
  return parseFloat(sum / sum3)
}
function top10(q) {
  query_tfidf = return_query_tfidf(q)

  all_blogs = []
  for (let i = 0; i < 1450; i++) {
    cur_tfidf = []
    let sum = 0
    for (let j = i * final_kw.length; j < (i + 1) * final_kw.length; j++) {
      cur_tfidf.push(parseFloat(tfidf[j]))
      sum += parseFloat(tfidf[j])
    }
    // console.log(sum)
    similarity_value = calc_similarity(query_tfidf, cur_tfidf)
    all_blogs.push([similarity_value, i])
  }
  all_blogs.sort((a, b) => (a[0] > b[0] ? -1 : 1))
  top10_blogs = []
  for (let i = 0; i < 15; i++) {
    top10_blogs.push(all_blogs[i][1] + 1)
  }
  return top10_blogs
}

app.post('/blogs', (req, res) => {
  if (req.body.category != undefined) {
    sort_by = req.body.category
    all_blogs = []
    // console.log(sort_by)
    setTimeout(() => {
      if (sort_by === 'code') {
        Blog.find({ index_of_ps: { $in: top10_blogs_copy } })
          .sort({ code: 1 })
          .then((blog) => {
            res.render('index', {
              blogs: blog,
              title: 'Questions',
              query: req.body.category,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      } else if (sort_by === 'diff') {
        Blog.find({ index_of_ps: { $in: top10_blogs_copy } })
          .sort({ diff: 1 })
          .then((blog) => {
            res.render('index', {
              blogs: blog,
              title: 'Questions',
              query: req.body.category,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      } else {
        Blog.find({ index_of_ps: { $in: top10_blogs_copy } })
          .sort({ submissions: 1 })
          .then((blog) => {
            res.render('index', {
              blogs: blog,
              title: 'Questions',
              query: req.body.category,
            })
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }, 2000)
  } else {
    let query_cleaned = req.body.query
    query_cleaned = cleaner(query_cleaned)
    top10_blogs = top10(query_cleaned)
    top10_blogs_copy = top10_blogs

    all_blogs = []
    Blog.find({ index_of_ps: { $in: top10_blogs } })
      .sort({ sort_by: -1 })
      .then((blog) => {
        res.render('index', {
          blogs: blog,
          title: 'Questions',
          query: req.body.query,
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }
})

function format_contraints(constraints) {
  constraints = constraints.split(' ')
  for (let i = 0; i < constraints.length; i++) {
    if (constraints[i] === '\\leq') constraints[i] = '<='
    if (constraints[i] === '\\geq') constraints[i] = '>='
  }
  constraints = constraints.join(' ')
  return constraints
}
function format_contraints2(constraints) {
  console.log(constraints)
  for (let i = 0; i < constraints.length; i++) {
    if (constraints[i][0] === ',') constraints[i] = constraints[i].substr(1)
    if (constraints[i] != '\r' && constraints[i].length > 2) {
      let curLen = constraints[i].length
      let left = constraints[i].substr(0, (curLen - 1) / 2)
      let right = constraints[i].substr((curLen - 1) / 2, (curLen - 1) / 2)
      if (left === right) {
        constraints[i] = left + '\r'
      }
    }
  }
  return constraints
}
app.post('/feedbacks', (req, res) => {
  const fb = new Fb(req.body)
  setTimeout(() => {
    fb.save()
      .then((result) => {
        res.redirect('/feedbacks')
      })
      .catch((err) => {
        console.log(err)
      })
  }, 1800)
})

app.get('/blogs/:id', (req, res) => {
  const id = req.params.id
  Blog.findById(id)
    .then((result) => {
      let statement = result.statement
      statement = statement.split('$')
      statement = statement.join()

      let last = statement[0]
      statement2 = last
      for (let i = 1; i < statement.length; i++) {
        if (
          !(
            statement[i] === last && statement[i].toUpperCase() === statement[i]
          )
        ) {
          statement2 += statement[i]
          last = statement[i]
        }
      }
      statement = statement2
      let ps = ''
      statement = statement.split('Constraints')
      ps = statement[0]

      // console.log(output)
      statement = statement[1]
      subtasks = ''
      if (statement === undefined) {
        res.render('error', { title: 'PAGE NOT FOUND' })
      }
      if ((statement.match('Subtasks') || []).length != 0) {
        statement = statement.split('Subtasks')
        constraints = statement[0]
        constraints = format_contraints(constraints)
        constraints = constraints.split('\n')
        constraints = format_contraints2(constraints)
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
        // console.log(statement)
        statement = statement.split('Sample Input')
        subtasks = statement[0].split('\n')
        // console.log(subtasks)
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
      } else {
        // console.log(statement)
        statement = statement.split('Sample Input')
        constraints = statement[0]
        constraints = format_contraints(constraints)
        constraints = constraints.split('\n')
        constraints = format_contraints2(constraints)
        subtasks = []
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
        // console.log(statement)
      }
      // console.log(statement)
      statement = statement.split('Sample Output')
      sample_input = statement[0].split('\n')
      statement = statement[1]
      sample_output = []
      if ((statement.match('Explanation') || []).length != 0) {
        statement = statement.split('Explanation')
        sample_output = statement[0].split('\n')
        statement = statement[1]
        if (statement === undefined) {
          res.render('error', { title: 'PAGE NOT FOUND' })
        }
      }

      statement = statement.split('Author')
      explanation = statement[0].split('\n')

      statement = ps
      if ((statement.match('Input Format') || []).length != 0) {
        statement = statement.split('Input Format')
        ps = statement[0].split('\n')
        statement = statement[1]
      } else {
        statement = statement.split('Input')
        ps = statement[0].split('\n')
        statement = statement[1]
      }
      if (statement === undefined) {
        res.render('error', { title: 'PAGE NOT FOUND' })
      }

      if ((statement.match('Output Format') || []).length != 0) {
        statement = statement.split('Output Format')
        input = statement[0].split('\n')
        statement = statement[1]
      } else {
        statement = statement.split('Output')
        input = statement[0].split('\n')
        // console.log(input)
        if (input[0] === ':\r') input.shift()
        statement = statement[1]
      }
      if (statement === undefined) {
        res.render('error', { title: 'PAGE NOT FOUND' })
      }
      // input = statement[0].split('\n')
      output = statement.split('\n')
      // console.log(statement)
      if (output[0] === ':\r') output.shift()
      subtask_len = subtasks.length
      // subtasks = [[subtasks.length], subtasks]
      // // ps = ps.split('\n')
      res.render('details', {
        blog: result,
        title: 'Problem Statement',
        details: {
          ps,
          input,
          output,
          constraints,
          subtasks,
          subtask_len,
          sample_input,
          sample_output,
          explanation,
        },
      })
    })
    .catch((err) => {
      console.log(err)
    })
})

// 404 page
app.use((req, res) => {
  // res.status(404).render('404', { title: '404' })
  res.render('error', { title: 'PAGE NOT FOUND' })
})
