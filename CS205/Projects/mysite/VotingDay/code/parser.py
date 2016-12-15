import numpy
import os
import csv
from django.db.models import F

class Party(object):
    def __init__(self, party_name, totalvotes, vote1, vote2, vote3, vote4, vote5, vote6, vote7, vote8, vote9, vote10, vote11, vote12, vote13, vote14, vote15):
        self.party_name = party_name
        self.totalvotes = totalvotes
        self.vote1 = vote1
        self.vote2 = vote2
        self.vote3 = vote3
        self.vote4 = vote4
        self.vote5 = vote5
        self.vote6 = vote6
        self.vote7 = vote7
        self.vote8 = vote8
        self.vote9 = vote9
        self.vote10 = vote10
        self.vote11 = vote11
        self.vote12 = vote12
        self.vote13 = vote13
        self.vote14 = vote14
        self.vote15 = vote15

if os.path.exists ('votes.csv'):

    with open('votes.csv') as vfile:
        votelines = vfile.readlines()
    print votelines

    number_of_options = len(votelines)
    Total = [0]* (number_of_options - 1) #5
    Party_votes = [0]* (number_of_options - 1) #5
    votedetails = [0]* (number_of_options) #6

    for i in range (0, number_of_options):
        votedetails[i] = [str(x) for x in votelines[i].rstrip('\n').split(', ')]

    for i in range (0, number_of_options - 1):
        Total[i] = int(votedetails[i][1]) #total party votes
        votedetails[i].remove(votedetails[i][1]);
        votedetails[i].remove(votedetails[i][0]);
        Party_votes[i] = votedetails[i] # vote1-15

    NOTA = int(votedetails[number_of_options - 1][1]) #nota votes

    for i in range (0, number_of_options - 1):
        for j in range (0, len(Party_votes[i])):
            Party_votes[i][j] = int(Party_votes[i][j])

if os.path.exists ('candidates.csv'):

    with open('candidates.csv') as pfile:
        partylines = pfile.readlines()

    number_of_parties = len(partylines)
    partydetails = [0]* number_of_parties
    Party = [0]* number_of_parties
    PartyName = [0]* number_of_parties
    max_seats = [0]* number_of_parties
    total_seats = [0]* number_of_parties
    Party_seats = [0]* number_of_parties
    zipped  = [0]* number_of_parties
    rzipped  = [0]* number_of_parties

    for i in range (0, number_of_parties):
        partydetails[i] = [str(x) for x in partylines[i].rstrip('\n').split(', ')]

    for i in range (0, number_of_parties):
        PartyName[i] = partydetails[i][0]
        partydetails[i].remove(partydetails[i][0]);
        Party[i] = partydetails[i]

    for i in range (0, number_of_parties):
        zipped[i] = zip(Party[i], Party_votes[i])
        rzipped[i] = sorted(zipped[i], key = lambda x: x[1], reverse = True)

    for i in range (0, number_of_parties):
        for j in range (0, len(partydetails[i])):
            max_seats[i] = max_seats[i] + 1

#change these to read from csv file
number_of_voters = 322 #number of users
number_of_seats = 15
extra = 0

#basic structure of variables
seats_left = number_of_seats
number_of_people_who_voted = NOTA
for i in range (0, number_of_parties):
    number_of_people_who_voted = number_of_people_who_voted + Total[i]
number_of_people_who_didnt_vote = number_of_voters - number_of_people_who_voted
election_quotient = number_of_voters / number_of_seats
currentEQ = election_quotient
percent_of_people_who_voted = ((number_of_people_who_voted * 1.0 / number_of_voters)) * 100
percent_of_people_who_didnt_vote = ((number_of_people_who_didnt_vote * 1.0 / number_of_voters)) * 100

#algorithm
while (seats_left != 0) and (currentEQ != 0):
    for i in range (0, number_of_parties):
        no_of_seats = Total[i] / currentEQ
        if no_of_seats > max_seats[i]:
            number_of_seats = max_seats[i]
            Total[i] = 0
        Total[i] = (Total[i] % currentEQ)
        Party_seats[i] = Party_seats[i] + no_of_seats
        if Party_seats[i] > max_seats[i]:
            extra = Party_seats[i] - max_seats[i]
            Party_seats[i] = Party_seats[i] - extra
            Total[i] = 0
        seats_left = seats_left - no_of_seats + extra
    currentEQ = currentEQ - 1
    extra = 0

print
print "Number of seats Won by each party:"
print
for i in range (0, number_of_parties):
    print PartyName[i]
    print Party_seats[i]
    print

print "Meet the HORs:"
for j in range (0, number_of_parties):
    for k in range (0, Party_seats[j]):
        print rzipped[j][k]
print

#print number_of_people_who_voted
#print
#print number_of_people_who_didnt_vote
#print
#print ("%.2f" % round(percent_of_people_who_voted,2))
#print
#print ("%.2f" % round(percent_of_people_who_didnt_vote,2))
