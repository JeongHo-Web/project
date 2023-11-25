const express = require('express')
const qs = require('qs')
const mysql      = require('mysql');
const HTML = require('./template/template.js')
const db = mysql.createConnection({ // [수정]
    host     : '127.0.0.1',
    user     : 'root',
    password : 'apmsetup',
    database : 'readinglife'
});

db.connect()
const app = express()

app.get('/', (req, res) => { // 메인
    res.sendFile(__dirname + '/main.html') // [수정]
})

app.get('/intro', (req, res) => { // 소개 페이지
    res.sendFile(__dirname + '/intro.html'); // [수정]
})

app.get('/search', (req, res) => {
    const {q} = req.query;
    if (q === undefined) {
        res.sendFile(__dirname + '/search.html') // 쿼리가 없을 때 검색 페이지 보여주기
    }
    else {
        db.query(`select * from post where bookName = ?`, [q], (err, data) => {
            let htmlPage = ``
            if (data.length === 0) {
                htmlPage += `<h1>No results.</h1>` // [수정] 검색 결과가 없을 때
            }
            else {
                if (err) throw err
                for(let i = 0; i < data.length; i++) {
                    htmlPage += `<h1>${data[i].bookName}</h1><img src="${data[i].bookImage}"><h3>${data[i].author}</h3><h3>${data[i].category}</h3><br><br>` // [수정] 검색 결과가 있을 때
                }
            }
            res.send(HTML.returnHTML(htmlPage))
        })
    }
    // console.log(q)
})

app.get('/category', (req, res) => {
    const {q} = req.query;
    if (q === undefined) {
        res.sendFile(__dirname + '/category.html')
    }
    else {
        db.query(`select * from post where category = ?`, [q], (err, data) => {
            if (err) throw err
            let htmlPage = ``
            if (data.length === 0) {
                htmlPage += "<h1>No result.</h1>"
            }
            else {
                for(let i = 0; i < data.length; i++) {
                    htmlPage += `<h1>${data[i].bookName}</h1><h3>${data[i].author}</h3><h3>${data[i].category}</h3><br><br>`
                }
            }
            res.send(HTML.returnHTML(htmlPage))
        })
    }
})

app.get('/post', (req, res) => { // 게시물 페이지
    const {bookId} = req.query
    if (bookId === undefined) {
        res.redirect(302, '/')
    }
    else {
        db.query(`select * from post where id = ${bookId}`, (err, bookInfo) => {
            if (err) throw err
            if (bookInfo.length === 0) {
                temp = '<h1>No result.</h1>' // [수정] 게시물이 없을 때
            }
            else {
                temp = `<h1>${bookInfo[0].bookName}</h1><img src="${bookInfo[0].bookImage}"><h3>${bookInfo[0].author}</h3><h3>${bookInfo[0].category}</h3>` // [수정] 게시물이 있을 때
            }
            db.query(`select * from comment where id = ${bookId}`, (err, comments) => {
                if (err) throw err
                if (comments.length === 0 && bookInfo.length != 0) {
                    temp += '<br><br><h3>No comments.</h3>' // [수정] 댓글이 없을 때
                }
                else {
                    for(let i = 0; i < comments.length; i++) {
                        temp += `<br><br><h3>${comments[i].content}` // [수정] 댓글이 있을 때
                    }
                }
                htmlPage = HTML.returnHTML(temp)
                res.send(htmlPage)
            })
        })
    }
})

app.get('/update', (req, res) => { // 업데이트 페이지
    res.sendFile(__dirname + '/update.html')
})

app.post('/create_process', (req, res) => { // 게시물 or 댓글 생성
    let body = '' 
    console.log('point 1')
    req.on('data', (data) => {
        body = body + data
    })    
    
    req.on('end', () => {
        const post = qs.parse(body)
        let query_column_list = Object.keys(post)
        let query_list = Object.values(post)
        let table = ''
        if (query_list.length === 2) table = 'comment'; else table = 'post';

        db.query(`insert into ${table} (date,${query_column_list.join()}) values (now()${', ?'.repeat(query_list.length)})`, query_list, (err, data) => {
            if (err) throw err;
            const lastInsertId = data.insertId;
            res.redirect(302, `/post?bookId=${lastInsertId}`)
        })
    })
})

app.post('/update_process', (req, res) => { // 게시물 or 댓글 업데이트
    let body = ''
    req.on('data', (data) => {
        body = body + data
    })

    req.on('end', () => {
        post = qs.parse(body)
        let query_column_list, query_list, table = '';
        
        const postId = post['id']; delete post['id']
        query_column_list = Object.keys(post)
        query_list = Object.values(post); query_list.push(postId)
        if (query_list.length === 2) table = 'comment'; else table = 'post'
        
        db.query(`update ${table} set ${query_column_list.join('=?, ') + '=?'} where id = ?`, query_list, (err) => {
            if (err) throw err;
            res.redirect(302, `/post?bookId=${bookId}`)
        })
    })
    return 'hello'
})

app.post('/delete_process', (req, res) => { // 게시물 or 댓글 삭제
    let body = ''
    req.on('data', (data) => {
        body = body + data
    })
    
    req.on('end', () => {
        post = qs.parse(body)
        db.query(`delete from ${post.contentType} where id = ${post.id}`, (err) => {
            if (err) throw err;
            res.redirect(302, '/')
        })
    })
})

app.listen(3000, () => {
    console.log('Server is running...')
})