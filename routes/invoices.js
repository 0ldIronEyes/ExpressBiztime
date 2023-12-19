const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT id, comp_code FROM invoices`
        );
    
    return res.json({"invoices": result.rows});
    }
    catch(err) {
        return next(err);
    }
})

router.get('/:invoice', async function (req, res, next) {
    try {
        const invoice = req.params.invoice;
        const result = await db.query( 
            `SELECT inv.comp_code, inv.amt, inv.paid, inv.add_date, inv.paid_date, com.name, com.description
            FROM invoices AS inv INNER JOIN companies as com ON (inv.comp_code = com.code) WHERE id= $1`, [invoice]);
    
    if (result.rows.length == 0)
    {
        throw new ExpressError(`No such invoice: ${invoice}`, 404);
    }
    
    const data = result.rows[0];
    const invObject = {
        id : data.id,
        amt: data.amt,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
        company: {
            code: data.comp_code,
            name: data.name,
            description: data.description
        }
    };
     return res.json({"invoice": invObject});
    }
    catch(err)
    {
        return next(err);
    }
});

router.post('/', async function (req, res, next) {
  try{
    let {comp_code, amt} = req.body;

    const result = await db.query(
        `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
    )
    return res.json({"invoice": result.rows[0]});
  }  
  catch (err)
  {
    return next(err);
  }
});

router.put("/:invoice", async function (req, res, next) {
    try{
        let {amt, paid} = req.body;
        const invoice = req.prams.invoice;
        let paidDate= null;

        const editedInvoice = await db.query('SELECT paid FROM invoices WHERE id= $1', [invoice])
        
        if (editedInvoice.rows.length === 0)
        {
            throw new ExpressError(`No such invoice: ${invoice}`, 404);
        }

        const currPaidDate = editedInvoice.rows[0].paid_date;

        if (!paid)
        {
            paid = null;
        }
        if (!currPaidDate && paid)
        {
            paidDate = new Date();
        }
        else
        {
            paidDate = currPaidDate;
        }
        
        const result = await db.query(
            `UPDATE invoices
            SET amt=$1, paid=$2, paid_date=$3
            WHERE id=$4
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt,paid, paidDate, id]
        );

        return res.json({"invoice": result.rows[0]});
    }
    catch(err)
    {
        return next(err);
    }
})

router.delete("/:invoice", async function (req, res, next) {
    try
    {
        let invoice = req.params.invoice;
        const result = await db.query(
            `DELTE FROM invoices
             WHERE id = $1
             RETURNING id`,
             [invoice]
            );
    if (result.rows.length === 0)
    {
        throw new ExpressError('No such invoice ${invoice}', 404);
    }
    return res.json({"status" : "deleted"})
    }
    catch(err)
    {
        return next(err);
    }
})

module.exports = router;